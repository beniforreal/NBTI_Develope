
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';


import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getIdToken
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
  logEvent 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

class FirebaseDataManager {
  constructor() {
    this.db = window.firebaseDb;
    this.auth = window.firebaseAuth;
    this.analytics = window.firebaseAnalytics;
    this.currentUser = null;
    this.tokenExpiryTime = null;
    this.tokenRefreshInterval = null;
    this.userIP = null;
    this.refreshCount = 0;
    this.lastRefreshTime = 0;
    this.isBanned = false;
    this.requestCount = 0;
    this.requestWindow = [];
    this.rateLimitThreshold = 100; // 1분당 100회 요청 제한
    
    this.initAuth();
    this.initSecurity();
  }

  initAuth() {
    // 페이지 로드 시 토큰 만료 상태 확인
    this.checkStoredTokenExpiry();
    
    // 캐시 무효화 처리
    this.handleCacheInvalidation();
    
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      
      if (user) {
        this.setupTokenExpiry();
      } else {
        this.clearTokenExpiry();
      }
      
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: this.currentUser } 
      }));
    });
  }

  async initSecurity() {
    try {
      // IP 주소 가져오기
      await this.getUserIP();
      
      // 보안 컬렉션 초기화 (자동 생성)
      await this.initializeSecurityCollections();
      
      // 벤 상태 확인
      await this.checkBanStatus();
      
      // 새로고침 감지 설정
      this.setupRefreshDetection();
      
      // 페이지 언로드 시 로그 저장
      this.setupUnloadLogging();
      
      // 초기 보안 로그 생성 (주석처리)
      // await this.logSecurityEvent('PAGE_LOAD', {
      //   userAgent: navigator.userAgent,
      //   timestamp: Date.now(),
      //   domain: window.location.hostname,
      //   path: window.location.pathname
      // });
      
    } catch (error) {
      // 보안 초기화 실패 시에도 기본 기능은 유지
    }
  }

  async initializeSecurityCollections() {
    try {
      // banned_ips 컬렉션 초기화 (더미 문서로 컬렉션 생성)
      const banRef = doc(this.db, 'banned_ips', '_init');
      const banSnap = await getDoc(banRef);
      
      if (!banSnap.exists()) {
        await setDoc(banRef, {
          _initialized: true,
          createdAt: serverTimestamp(),
          description: 'Security collection initialized'
        });
      }
      
      // security_logs 컬렉션 초기화 (더미 문서로 컬렉션 생성)
      const logRef = doc(this.db, 'security_logs', '_init');
      const logSnap = await getDoc(logRef);
      
      if (!logSnap.exists()) {
        await setDoc(logRef, {
          _initialized: true,
          createdAt: serverTimestamp(),
          description: 'Security logs collection initialized'
        });
      }
      
    } catch (error) {
      // 컬렉션 초기화 실패 시 무시
    }
  }

  async getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      this.userIP = data.ip;
    } catch (error) {
      // IP 가져오기 실패 시 로컬 IP 사용
      this.userIP = 'unknown';
    }
  }

  async checkBanStatus() {
    if (!this.userIP) return;
    
    try {
      const banRef = doc(this.db, 'banned_ips', this.userIP);
      const banSnap = await getDoc(banRef);
      
      if (banSnap.exists()) {
        const banData = banSnap.data();
        if (banData.isActive && banData.expiresAt > Date.now()) {
          this.isBanned = true;
          this.showBanMessage(banData);
        }
      }
    } catch (error) {
      // 벤 상태 확인 실패 시 무시
    }
  }

  showBanMessage(banData) {
    const banTime = new Date(banData.expiresAt).toLocaleString('ko-KR');
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: #1a1a1a;
        color: #ff6b6b;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1>🚫 접근이 제한되었습니다</h1>
          <p>너무 빠른 새로고침으로 인해 일시적으로 접근이 제한되었습니다.</p>
          <p>해제 시간: ${banTime}</p>
          <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
        </div>
      </div>
    `;
  }

  setupRefreshDetection() {
    const now = Date.now();
    const timeDiff = now - this.lastRefreshTime;
    
    // 5초 이내 새로고침 감지
    if (timeDiff < 5000) {
      this.refreshCount++;
    } else {
      this.refreshCount = 1;
    }
    
    this.lastRefreshTime = now;
    
    // 10초 이내 5회 이상 새로고침 시 벤
    if (this.refreshCount >= 5) {
      this.banUser();
    }
    
    // 1분 후 카운트 리셋
    setTimeout(() => {
      this.refreshCount = Math.max(0, this.refreshCount - 1);
    }, 60000);
  }

  async banUser() {
    if (!this.userIP || this.isBanned) return;
    
    try {
      const banData = {
        ip: this.userIP,
        isActive: true,
        banReason: 'Rapid refresh detected',
        banCount: this.refreshCount,
        bannedAt: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000), // 30분 벤
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      };
      
      // 벤 정보 저장
      await setDoc(doc(this.db, 'banned_ips', this.userIP), banData);
      
      // 로그 저장 (주석처리)
      // await this.logSecurityEvent('RAPID_REFRESH_BAN', banData);
      
      this.isBanned = true;
      this.showBanMessage(banData);
      
    } catch (error) {
      // 벤 처리 실패 시 무시
    }
  }

  async logSecurityEvent(eventType, data) {
    // 로그 한도 초과로 인해 주석처리
    /*
    try {
      let userName = null;
      
      // 로그인한 사용자의 경우 DB에서 name 가져오기
      if (this.currentUser) {
        try {
          const memberRef = doc(this.db, 'members', this.currentUser.uid);
          const memberSnap = await getDoc(memberRef);
          if (memberSnap.exists()) {
            const memberData = memberSnap.data();
            userName = memberData.name || null;
          }
        } catch (error) {
          // 사용자 정보 가져오기 실패 시 무시
        }
      }
      
      // KST 날짜/시간 형식으로 변환
      const now = new Date();
      const kstTimestamp = now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Seoul'
      });
      
      const logData = {
        eventType: eventType,
        ip: this.userIP || 'unknown',
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        kstTimestamp: kstTimestamp,
        data: data,
        userId: this.currentUser ? this.currentUser.uid : null,
        userName: userName,
        userEmail: this.currentUser ? this.currentUser.email : null,
        isAuthenticated: this.currentUser ? true : false
      };
      
      await addDoc(collection(this.db, 'security_logs'), logData);
    } catch (error) {
      // 로그 저장 실패 시 무시 (비로그인 사용자도 정상 작동하도록)
    }
    */
  }

  setupUnloadLogging() {
    window.addEventListener('beforeunload', () => {
      // 로그 한도 초과로 인해 주석처리
      // this.logSecurityEvent('PAGE_UNLOAD', {
      //   refreshCount: this.refreshCount,
      //   sessionDuration: Date.now() - this.lastRefreshTime
      // });
    });
  }

  async unbanUser(ip) {
    try {
      const banRef = doc(this.db, 'banned_ips', ip);
      await updateDoc(banRef, {
        isActive: false,
        unbannedAt: Date.now()
      });
      
      // await this.logSecurityEvent('USER_UNBANNED', { ip: ip });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // DDoS 방어: 요청 빈도 제한
  checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // 1분 이전 요청들 제거
    this.requestWindow = this.requestWindow.filter(time => time > oneMinuteAgo);
    
    // 현재 요청 추가
    this.requestWindow.push(now);
    
    // 요청 수가 임계값을 초과하면 차단
    if (this.requestWindow.length > this.rateLimitThreshold) {
      this.handleRateLimitExceeded();
      return false;
    }
    
    return true;
  }

  async handleRateLimitExceeded() {
    try {
      const banData = {
        ip: this.userIP,
        isActive: true,
        banReason: 'Rate limit exceeded',
        requestCount: this.requestWindow.length,
        bannedAt: Date.now(),
        expiresAt: Date.now() + (60 * 60 * 1000), // 1시간 벤
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      };
      
      await setDoc(doc(this.db, 'banned_ips', this.userIP), banData);
      // await this.logSecurityEvent('RATE_LIMIT_BAN', banData);
      
      this.isBanned = true;
      this.showBanMessage(banData);
      
    } catch (error) {
      // DDoS 방어 실패 시 무시
    }
  }

  // 모든 Firestore 요청에 DDoS 방어 적용
  async secureFirestoreOperation(operation, ...args) {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }
    
    return await operation(...args);
  }

  // XSS 및 인젝션 공격 방어
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // HTML 태그 제거
    input = input.replace(/<[^>]*>/g, '');
    
    // JavaScript 이벤트 제거
    input = input.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // 위험한 문자 이스케이프
    input = input.replace(/[<>'"&]/g, (match) => {
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    });
    
    // SQL 인젝션 패턴 제거
    input = input.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '');
    
    // 스크립트 태그 제거
    input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    return input.trim();
  }

  // 사용자 데이터 검증
  validateUserData(data) {
    const sanitizedData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // 길이 제한
        if (value.length > 1000) {
          throw new Error(`Field ${key} exceeds maximum length`);
        }
        
        // 특수 문자 검사
        if (/[<>'"&]/.test(value)) {
          sanitizedData[key] = this.sanitizeInput(value);
        } else {
          sanitizedData[key] = value;
        }
      } else {
        sanitizedData[key] = value;
      }
    }
    
    return sanitizedData;
  }

  // 파일 업로드 검증
  validateFileUpload(file) {
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type');
    }
    
    // 파일명 검증
    const sanitizedName = this.sanitizeInput(file.name);
    if (sanitizedName !== file.name) {
      throw new Error('Invalid file name');
    }
    
    return true;
  }

  handleCacheInvalidation() {
    // 서비스 워커 캐시 무효화 (있는 경우)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // localStorage에서 캐시 버전 확인
    const currentVersion = '1.0.0';
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion !== currentVersion) {
      // 버전이 다르면 캐시 클리어
      this.clearAllCaches();
      localStorage.setItem('app_version', currentVersion);
    }
  }

  clearAllCaches() {
    // localStorage 정리 (토큰 관련 제외)
    const keysToKeep = ['firebase_token_expiry', 'app_version'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // sessionStorage 정리
    sessionStorage.clear();
    
    // IndexedDB 정리 (Firebase Auth 관련 제외)
    if ('indexedDB' in window) {
      const databases = ['firebaseLocalStorageDb'];
      databases.forEach(dbName => {
        indexedDB.deleteDatabase(dbName);
      });
    }
  }

  checkStoredTokenExpiry() {
    const storedExpiry = localStorage.getItem('firebase_token_expiry');
    if (storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      if (Date.now() >= expiryTime) {
        // 토큰이 만료된 경우 로그아웃
        this.signOut();
        localStorage.removeItem('firebase_token_expiry');
      }
    }
  }

  setupTokenExpiry() {
    if (!this.currentUser) return;
    
    // 1시간 후 토큰 만료 설정
    this.tokenExpiryTime = Date.now() + (60 * 60 * 1000); // 1시간 = 60분 * 60초 * 1000ms
    
    // 50분마다 토큰 갱신 체크 (1시간 전에 갱신)
    this.tokenRefreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, 50 * 60 * 1000); // 50분마다 체크
    
    // 토큰 만료 시간을 localStorage에 저장
    localStorage.setItem('firebase_token_expiry', this.tokenExpiryTime.toString());
  }

  clearTokenExpiry() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
    this.tokenExpiryTime = null;
    localStorage.removeItem('firebase_token_expiry');
  }

  async checkAndRefreshToken() {
    if (!this.currentUser) return;
    
    try {
      // 토큰 갱신
      await this.currentUser.getIdToken(true);
      
      // 새로운 만료 시간 설정
      this.tokenExpiryTime = Date.now() + (60 * 60 * 1000);
      localStorage.setItem('firebase_token_expiry', this.tokenExpiryTime.toString());
      
    } catch (error) {
      // 토큰 갱신 실패 시 로그아웃
      await this.signOut();
    }
  }

  isTokenExpired() {
    if (!this.tokenExpiryTime) return false;
    return Date.now() >= this.tokenExpiryTime;
  }

  onAuthStateChanged(callback) {
    return onAuthStateChanged(this.auth, callback);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      if (this.analytics) {
        logEvent(this.analytics, 'login', {
          method: 'email'
        });
      }
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        'prompt': 'select_account',
        'access_type': 'offline'
      });
      
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      
      if (this.analytics) {
        logEvent(this.analytics, 'login', {
          method: 'google'
        });
      }
      
      await this.createOrUpdateUserProfile(user);
      
      return { success: true, user: user };
    } catch (error) {
      // console.error('Google 로그인 실패:', error);
      
      if (error.code === 'auth/popup-blocked') {
        return { success: false, error: '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.' };
      } else if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: '로그인 창이 닫혔습니다. 다시 시도해주세요.' };
      } else if (error.code === 'auth/unauthorized-domain') {
        return { success: false, error: '도메인이 승인되지 않았습니다. 관리자에게 문의해주세요.' };
      } else if (error.code === 'auth/operation-not-allowed') {
        return { success: false, error: 'Google 로그인이 비활성화되어 있습니다. 관리자에게 문의해주세요.' };
      } else if (error.code === 'auth/unauthorized-domain') {
        return { success: false, error: '이 도메인에서 Google 로그인이 허용되지 않습니다.' };
      }
      return { success: false, error: error.message };
    }
  }

  async createOrUpdateUserProfile(user) {
    try {
      const memberRef = doc(this.db, 'members', user.uid);
      const memberSnap = await getDoc(memberRef);
      
      if (!memberSnap.exists()) {
        const userData = {
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          avatar: user.displayName ? user.displayName.charAt(0) : user.email.charAt(0),
          role: '길드원',
          status: 'pending',
          order: 999, // 기본 순서값 (가장 뒤로)
          tags: ['새멤버'],
          profile: {
            bio: 'Google 로그인으로 가입한 새 멤버입니다.',
            interests: ['게임', '친목']
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(memberRef, userData);
      } else {
        await updateDoc(memberRef, {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      // console.error('사용자 프로필 처리 실패:', error);
    }
  }

  async signOut() {
    try {
      // 토큰 만료 정보 정리
      this.clearTokenExpiry();
      
      await signOut(this.auth);
      return { success: true };
    } catch (error) {
      // console.error('로그아웃 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 새 사용자 등록
   */
  async signUp(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Firestore에 사용자 정보 저장
      await this.addMember({
        ...userData,
        email: user.email,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      
      // console.log('회원가입 성공:', user.email);
      return { success: true, user: user };
    } catch (error) {
      // console.error('회원가입 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 길드원 데이터 로드 (승인된 멤버만)
   */
  async loadMembers() {
    try {
      const membersRef = collection(this.db, 'members');
      const q = query(membersRef, where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const members = [];
      querySnapshot.forEach((doc) => {
        members.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 우선순위에 따른 정렬
      const sortedMembers = this.sortMembersByPriority(members);
      
      // console.log('승인된 길드원 데이터 로드 완료:', sortedMembers.length, '명');
      return sortedMembers;
    } catch (error) {
      // console.error('길드원 데이터 로드 실패:', error);
      return [];
    }
  }

  /**
   * 멤버 우선순위 정렬
   */
  sortMembersByPriority(members) {
    return members.sort((a, b) => {
      // 1. 길드 마스터가 최우선
      if (a.role === '길드 마스터' && b.role !== '길드 마스터') return -1;
      if (b.role === '길드 마스터' && a.role !== '길드 마스터') return 1;
      
      // 2. 길드 마스터끼리는 생성일 순
      if (a.role === '길드 마스터' && b.role === '길드 마스터') {
        return (a.createdAt?.toDate?.() || new Date(a.createdAt)) - (b.createdAt?.toDate?.() || new Date(b.createdAt));
      }
      
      // 3. 부길드장은 순서대로 (order 필드 기준, 없으면 생성일 순)
      if (a.role === '부길드장' && b.role === '부길드장') {
        const aOrder = a.order || 0;
        const bOrder = b.order || 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return (a.createdAt?.toDate?.() || new Date(a.createdAt)) - (b.createdAt?.toDate?.() || new Date(b.createdAt));
      }
      
      // 4. 부길드장이 일반 유저보다 우선
      if (a.role === '부길드장' && b.role !== '부길드장' && b.role !== '길드 마스터') return -1;
      if (b.role === '부길드장' && a.role !== '부길드장' && a.role !== '길드 마스터') return 1;
      
      // 5. 일반 유저는 순서대로 (order 필드 기준, 없으면 생성일 순)
      const aOrder = a.order || 0;
      const bOrder = b.order || 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // 6. 최종적으로 생성일 순
      return (a.createdAt?.toDate?.() || new Date(a.createdAt)) - (b.createdAt?.toDate?.() || new Date(b.createdAt));
    });
  }

  /**
   * 모든 멤버 데이터 로드 (승인/미승인 포함, 관리자용)
   */
  async loadAllMembers() {
    try {
      const membersRef = collection(this.db, 'members');
      const q = query(membersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const members = [];
      querySnapshot.forEach((doc) => {
        members.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 우선순위에 따른 정렬
      const sortedMembers = this.sortMembersByPriority(members);
      
      // console.log('전체 멤버 데이터 로드 완료:', sortedMembers.length, '명');
      return sortedMembers;
    } catch (error) {
      // console.error('전체 멤버 데이터 로드 실패:', error);
      return [];
    }
  }

  /**
   * 미승인 멤버 목록 로드 (Firebase Console에서만 관리)
   */
  async loadPendingMembers() {
    // console.log('미승인 멤버 목록은 Firebase Console에서만 확인 가능합니다.');
    return [];
  }

  /**
   * 길드원 추가
   */
  async addMember(memberData) {
    try {
      const membersRef = collection(this.db, 'members');
      const docRef = await addDoc(membersRef, {
        ...memberData,
        order: memberData.order || 999, // 기본 순서값 설정
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // console.log('길드원 추가 완료:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      // console.error('길드원 추가 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 길드원 업데이트
   */
  async updateMember(memberId, updateData) {
    try {
      const memberRef = doc(this.db, 'members', memberId);
      await updateDoc(memberRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      // console.log('길드원 업데이트 완료:', memberId);
      return { success: true };
    } catch (error) {
      // console.error('길드원 업데이트 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Firestore 컬렉션 참조 가져오기
   */
  getCollection(collectionName) {
    return collection(this.db, collectionName);
  }

  /**
   * Firestore 문서 참조 가져오기
   */
  getDocRef(collectionName, docId) {
    return doc(this.db, collectionName, docId);
  }

  /**
   * Firestore 문서 가져오기
   */
  async getDocument(docRef) {
    return await getDoc(docRef);
  }

  /**
   * Firestore 문서 가져오기 (호환성용)
   */
  async getDoc(docRef) {
    return await getDoc(docRef);
  }

  /**
   * 길드원 삭제
   */
  async deleteMember(memberId) {
    try {
      const memberRef = doc(this.db, 'members', memberId);
      await deleteDoc(memberRef);
      
      // console.log('길드원 삭제 완료:', memberId);
      return { success: true };
    } catch (error) {
      // console.error('길드원 삭제 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 사진 데이터 로드
   */
  async loadPhotos() {
    try {
      const photosRef = collection(this.db, 'photos');
      const q = query(photosRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const photos = [];
      querySnapshot.forEach((doc) => {
        photos.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // console.log('사진 데이터 로드 완료:', photos.length, '장');
      return photos;
    } catch (error) {
      // console.error('사진 데이터 로드 실패:', error);
      return [];
    }
  }

  /**
   * 사진 추가
   */
  async addPhoto(photoData) {
    try {
      const photosRef = collection(this.db, 'photos');
      const docRef = await addDoc(photosRef, {
        ...photoData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // console.log('사진 추가 완료:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      // console.error('사진 추가 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 사진 삭제
   */
  async deletePhoto(photoId) {
    try {
      const photoRef = doc(this.db, 'photos', photoId);
      await deleteDoc(photoRef);
      
      // console.log('사진 삭제 완료:', photoId);
      return { success: true };
    } catch (error) {
      // console.error('사진 삭제 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 이미지 업로드 (Supabase Storage)
   */
  async uploadImage(file, path = 'images') {
    try {
      // Supabase Storage 사용
      if (typeof window.supabaseStorage !== 'undefined') {
        return await window.supabaseStorage.uploadImage(file, path);
      } else {
        throw new Error('Supabase Storage가 초기화되지 않았습니다.');
      }
    } catch (error) {
      // console.error('이미지 업로드 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 이미지 삭제 (Supabase Storage)
   */
  async deleteImage(imageUrl) {
    try {
      // Supabase Storage 사용
      if (typeof window.supabaseStorage !== 'undefined') {
        // console.log('삭제할 이미지 URL:', imageUrl);
        
        // Supabase Storage URL에서 파일 경로 추출
        // URL 형태: https://zrbcxremffbsjijfsfsm.supabase.co/storage/v1/object/public/NBTI/img/profile/filename.webp
        const urlParts = imageUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'NBTI');
        
        if (bucketIndex === -1) {
          throw new Error('Supabase Storage URL 형식이 올바르지 않습니다.');
        }
        
        // NBTI 버킷 이후의 경로 추출
        const pathParts = urlParts.slice(bucketIndex + 1);
        const fullPath = pathParts.join('/');
        
        // console.log('추출된 파일 경로:', fullPath);
        
        return await window.supabaseStorage.deleteImage(fullPath);
      } else {
        throw new Error('Supabase Storage가 초기화되지 않았습니다.');
      }
    } catch (error) {
      // console.error('이미지 삭제 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 현재 사용자 정보 가져오기
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * 관리자 권한 확인
   */
  async isAdmin(userId = null) {
    try {
      const targetUserId = userId || (this.currentUser ? this.currentUser.uid : null);
      if (!targetUserId) return false;
      
      const memberRef = doc(this.db, 'members', targetUserId);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        const memberData = memberSnap.data();
        return memberData.role === '길드장' || memberData.role === '부길드장' || memberData.role === 'admin';
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 사용자 프로필 저장 (기존 상태 유지)
   */
  async saveUserProfile(userId, profileData) {
    try {
      const memberRef = doc(this.db, 'members', userId);
      
      // 기존 사용자 상태 확인
      const memberSnap = await getDoc(memberRef);
      let currentStatus = 'pending'; // 기본값
      
      if (memberSnap.exists()) {
        const existingData = memberSnap.data();
        currentStatus = existingData.status || 'pending';
      }
      
      // 보안 검증 적용
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }
      
      // 사용자 데이터 검증 및 정화
      const validatedData = this.validateUserData(profileData);
      
      // 상태를 제외한 업데이트 데이터 준비
      const updateData = { ...validatedData };
      delete updateData.status; // status 필드 제거
      
      await updateDoc(memberRef, {
        ...updateData,
        status: currentStatus, // 기존 상태 유지
        updatedAt: serverTimestamp()
      });
      
      // console.log('사용자 프로필 저장 완료 (상태 유지):', userId, '상태:', currentStatus);
      return { success: true, status: currentStatus };
    } catch (error) {
      // console.error('사용자 프로필 저장 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 멤버 승인 (Firebase Console에서만 가능)
   */
  async approveMember(memberId) {
    // console.log('멤버 승인은 Firebase Console에서만 가능합니다:', memberId);
    return { success: false, error: 'Firebase Console에서만 승인 가능합니다.' };
  }

  /**
   * 멤버 거부 (Firebase Console에서만 가능)
   */
  async rejectMember(memberId) {
    // console.log('멤버 거부는 Firebase Console에서만 가능합니다:', memberId);
    return { success: false, error: 'Firebase Console에서만 거부 가능합니다.' };
  }

  /**
   * 사용자 상태 확인
   */
  async getUserStatus(userId) {
    try {
      const memberRef = doc(this.db, 'members', userId);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        const memberData = memberSnap.data();
        return {
          status: memberData.status || 'pending',
          data: memberData
        };
      }
      
      return { status: 'not_found', data: null };
    } catch (error) {
      // console.error('사용자 상태 확인 실패:', error);
      return { status: 'error', data: null };
    }
  }

  /**
   * 통계 정보 가져오기
   */
  async getStats() {
    try {
      const [members, photos] = await Promise.all([
        this.loadMembers(),
        this.loadPhotos()
      ]);

      return {
        memberCount: members.length,
        photoCount: photos.length,
        lastUpdated: Date.now()
      };
    } catch (error) {
      // console.error('통계 정보 가져오기 실패:', error);
      return {
        memberCount: 0,
        photoCount: 0,
        lastUpdated: 0
      };
    }
  }

  /**
   * 관리자 계정 초기화 (Firebase Console에서만 관리)
   */

  /**
   * 캐시 클리어 (기존 dataManager 호환성)
   */
  clearCache() {
    // Firebase는 실시간 데이터이므로 캐시 클리어 불필요
    // console.log('Firebase Data Manager: 캐시 클리어 (실시간 데이터이므로 불필요)');
  }

  /**
   * 유틸리티 함수들 (기존 dataManager 호환성)
   */
  getUtils() {
    return {
      formatDate: (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '어제';
        if (diffDays < 7) return `${diffDays}일 전`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)}주 전`;
        
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
      },
      
      escapeHtml: (text) => {
        if (!text) return '';
        return text.replace(/[&<>"']/g, m => ({
          "&": "&amp;",
          "<": "&lt;", 
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[m]));
      },
      
      generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
      }
    };
  }

  // 공지사항 관련 함수들
  async loadNotices() {
    try {
      const noticesRef = collection(this.db, 'notices');
      const q = query(noticesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const notices = [];
      querySnapshot.forEach((doc) => {
        notices.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return notices;
    } catch (error) {
      // console.error('공지사항 로드 실패:', error);
      throw error;
    }
  }

  async addNotice(noticeData) {
    try {
      const noticesRef = collection(this.db, 'notices');
      const docData = {
        ...noticeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(noticesRef, docData);
      return true;
    } catch (error) {
      // console.error('공지사항 추가 실패:', error);
      throw error;
    }
  }

  async updateNotice(noticeId, updateData) {
    try {
      const noticeRef = doc(this.db, 'notices', noticeId);
      const docData = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(noticeRef, docData);
      return true;
    } catch (error) {
      // console.error('공지사항 업데이트 실패:', error);
      throw error;
    }
  }

  async deleteNotice(noticeId) {
    try {
      const noticeRef = doc(this.db, 'notices', noticeId);
      await deleteDoc(noticeRef);
      return true;
    } catch (error) {
      // console.error('공지사항 삭제 실패:', error);
      throw error;
    }
  }

  async getNotice(noticeId) {
    try {
      const noticeRef = doc(this.db, 'notices', noticeId);
      const noticeSnap = await getDoc(noticeRef);
      
      if (noticeSnap.exists()) {
        return {
          id: noticeSnap.id,
          ...noticeSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      // console.error('공지사항 조회 실패:', error);
      throw error;
    }
  }

  // 좋아요 관련 함수들
  async addDoc(collectionRef, data) {
    return await addDoc(collectionRef, data);
  }

  async deleteDoc(docRef) {
    return await deleteDoc(docRef);
  }

  query(collectionRef, ...queryConstraints) {
    return query(collectionRef, ...queryConstraints);
  }

  where(field, operator, value) {
    return where(field, operator, value);
  }

  async getDocs(queryRef) {
    return await getDocs(queryRef);
  }

  serverTimestamp() {
    return serverTimestamp();
  }
}

// 전역 인스턴스 생성
window.firebaseDataManager = new FirebaseDataManager();

// 기존 dataManager와 호환성을 위한 별칭
window.dataManager = window.firebaseDataManager;

// 유틸리티 함수들을 전역으로 노출
window.utils = window.firebaseDataManager.getUtils();

