class HeaderComponent {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.createHeaderHTML();
    this.createMobileBottomNav();
    this.attachEventListeners();
    this.checkAuthState();
    
    // 초기화 후 약간의 지연을 두고 버튼 상태 업데이트
    setTimeout(() => {
      this.updateLoginButton();
    }, 100);
  }

  createHeaderHTML() {
    const headerHTML = `
      <header class="main-header">
        <div class="header-content">
            <!-- 로고 -->
            <div class="logo">
              <a href="index.html">
                <span class="logo-text">NBTI 길드</span>
              </a>
            </div>

            <!-- 데스크톱 네비게이션 -->
            <nav class="header-nav">
              <a href="picture.html" class="nav-link" data-page="picture">
                <img src="img/camera.png" alt="카메라" class="nav-icon">
                모아보기
              </a>
              <a href="members.html" class="nav-link" data-page="members">👥 길드원</a>
              <div class="auth-buttons">
                <a href="#" class="nav-link login-btn" id="loginBtn" title="로그인">
                  <i class="fa-solid fa-right-to-bracket"></i>
                  <span class="nav-text">로그인</span>
                </a>
                <button type="button" class="relative inline-flex items-center p-2 text-sm font-medium text-center text-gray-700 bg-transparent rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-800 nav-link notification-btn" id="notificationBtn" title="알림" style="display: none;">
                  <i class="fa-solid fa-bell text-lg"></i>
                  <span class="sr-only">알림</span>
                  <div class="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -end-1 dark:border-gray-900 notification-badge" id="notificationBadge" style="display: none;">0</div>
                </button>
                <a href="mypage.html" class="nav-link mypage-btn" id="mypageBtn" title="마이페이지" style="display: none;">
                  <i class="fa-solid fa-user"></i>
                  <span class="nav-text">마이페이지</span>
                </a>
                <a href="#" class="nav-link logout-btn" id="logoutBtn" title="로그아웃" style="display: none;">
                  <i class="fa-solid fa-sign-out-alt"></i>
                  <span class="nav-text">로그아웃</span>
                </a>
              </div>
            </nav>

            <!-- 모바일 메뉴 버튼 -->
            <button class="mobile-menu-btn" id="mobileMenuBtn">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

      </header>
    `;

    const existingHeader = document.querySelector('.header');
    if (existingHeader) {
      existingHeader.remove();
    }

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
  }

  createMobileBottomNav() {
    const existingBottomNav = document.querySelector('.mobile-bottom-nav');
    if (existingBottomNav) {
      existingBottomNav.remove();
    }

    const bottomNavHTML = `
      <!-- 모바일 하단 고정 메뉴바 -->
      <div class="mobile-bottom-nav" id="mobileBottomNav">
        <a href="index.html" class="bottom-nav-link" data-page="index">
          <i class="fa-solid fa-home"></i>
          <span>홈</span>
        </a>
        <a href="picture.html" class="bottom-nav-link" data-page="picture">
          <i class="fa-solid fa-camera"></i>
          <span>모아보기</span>
        </a>
        <a href="members.html" class="bottom-nav-link" data-page="members">
          <i class="fa-solid fa-users"></i>
          <span>길드원</span>
        </a>
        <a href="#" class="bottom-nav-link auth-link login-btn" id="mobileLoginBtn" title="로그인" style="display: flex;">
          <i class="fa-solid fa-right-to-bracket"></i>
          <span>로그인</span>
        </a>
        <a href="#" class="bottom-nav-link auth-link notification-btn relative" id="mobileNotificationBtn" title="알림" style="display: none;">
          <i class="fa-solid fa-bell"></i>
          <span>알림</span>
          <div class="absolute inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full top-0 right-0 dark:border-gray-900 notification-badge" id="mobileNotificationBadge" style="display: none;">0</div>
        </a>
        <a href="mypage.html" class="bottom-nav-link auth-link mypage-btn" id="mobileMypageBtn" title="마이페이지" style="display: none;">
          <i class="fa-solid fa-user"></i>
          <span>마이페이지</span>
        </a>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bottomNavHTML);
  }

  attachEventListeners() {
    // 모바일 메뉴 버튼은 더 이상 필요하지 않음 (하단 고정 메뉴바 사용)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.style.display = 'none'; // 모바일 메뉴 버튼 숨김
    }

    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    const mobileNotificationBtn = document.getElementById('mobileNotificationBtn');
    const mypageBtn = document.getElementById('mypageBtn');
    const mobileMypageBtn = document.getElementById('mobileMypageBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => this.handleLoginClick(e));
    }

    if (mobileLoginBtn) {
      mobileLoginBtn.addEventListener('click', (e) => this.handleLoginClick(e));
    }

    if (notificationBtn) {
      notificationBtn.addEventListener('click', (e) => this.handleNotificationClick(e));
    }

    if (mobileNotificationBtn) {
      mobileNotificationBtn.addEventListener('click', (e) => this.handleNotificationClick(e));
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => this.handleLogoutClick(e));
    }

    this.setupAuthListener();
  }

  setupAuthListener() {
    const checkFirebase = () => {
      if (typeof firebaseDataManager !== 'undefined') {
        this.checkAuthState();
        
        firebaseDataManager.onAuthStateChanged((user) => {
          this.currentUser = user;
          this.updateLoginButton();
          
          window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: user } 
          }));
        });
      } else {
        setTimeout(checkFirebase, 500);
      }
    };
    
    checkFirebase();
  }

  checkAuthState() {
    if (typeof firebaseDataManager !== 'undefined') {
      this.currentUser = firebaseDataManager.getCurrentUser();
      this.updateLoginButton();
      
      // 로그인된 사용자라면 알람 배지 업데이트
      if (this.currentUser) {
        this.updateNotificationBadge();
      }
      
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: this.currentUser } 
      }));
    } else {
      // Firebase가 아직 로드되지 않은 경우 잠시 후 다시 시도
      setTimeout(() => {
        this.checkAuthState();
      }, 500);
    }
  }

  handleLoginClick(e) {
    e.preventDefault();
    
    if (this.currentUser) {
      window.location.href = 'mypage.html';
    } else {
      this.openLoginModal();
    }
  }

  handleNotificationClick(e) {
    e.preventDefault();
    this.openNotificationModal();
  }

  openNotificationModal() {
    // 알람 모달이 없으면 생성
    let notificationModal = document.getElementById('notificationModal');
    if (!notificationModal) {
      this.createNotificationModal();
      notificationModal = document.getElementById('notificationModal');
    }
    
    if (notificationModal) {
      notificationModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      this.loadNotifications();
    }
  }

  createNotificationModal() {
    const modalHTML = `
      <div id="notificationModal" class="notification-modal">
        <div class="notification-modal-content">
          <div class="notification-modal-header">
            <h3>알림</h3>
            <button class="notification-modal-close" id="notificationModalClose">&times;</button>
          </div>
          <div class="notification-modal-body">
            <div class="notification-list" id="notificationList">
              <!-- 알림 목록이 여기에 동적으로 추가됩니다 -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 모달 닫기 이벤트 리스너
    const closeBtn = document.getElementById('notificationModalClose');
    const modal = document.getElementById('notificationModal');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeNotificationModal());
    }
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeNotificationModal();
        }
      });
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
        this.closeNotificationModal();
      }
    });
  }

  closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  async loadNotifications() {
    if (!this.currentUser || typeof firebaseDataManager === 'undefined') {
      return;
    }
    
    try {
      const notifications = await firebaseDataManager.loadNotifications(this.currentUser.uid);
      this.displayNotifications(notifications);
    } catch (error) {
      console.error('알림 로드 실패:', error);
    }
  }

  displayNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    if (notifications.length === 0) {
      notificationList.innerHTML = '<p class="no-notifications">새로운 알림이 없습니다.</p>';
      return;
    }
    
    notificationList.innerHTML = '';
    notifications.forEach(notification => {
      const notificationElement = this.createNotificationElement(notification);
      notificationList.appendChild(notificationElement);
    });
  }

  createNotificationElement(notification) {
    const element = document.createElement('div');
    element.className = `notification-item ${notification.isRead ? 'read' : 'unread'}`;
    
    const timeAgo = this.formatTimeAgo(notification.createdAt);
    
    element.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          <i class="fa-solid ${this.getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-text">
          <p>${notification.message}</p>
          <span class="notification-time">${timeAgo}</span>
        </div>
      </div>
    `;
    
    // 알림 클릭 시 해당 포스트로 이동하고 읽음 처리
    element.addEventListener('click', () => {
      if (notification.postId) {
        window.location.href = `picture.html?id=${notification.postId}`;
      }
      // 읽지 않은 알림만 읽음 처리
      if (!notification.isRead) {
        this.markAsRead(notification.id);
        // UI에서 즉시 읽음 상태로 변경
        element.classList.remove('unread');
        element.classList.add('read');
      }
    });
    
    return element;
  }

  getNotificationIcon(type) {
    switch (type) {
      case 'like': return 'fa-heart';
      case 'comment': return 'fa-comment';
      case 'follow': return 'fa-user-plus';
      default: return 'fa-bell';
    }
  }

  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffTime = Math.abs(now - time);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return time.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit'
    });
  }

  async markAsRead(notificationId) {
    if (typeof firebaseDataManager === 'undefined') return;
    
    try {
      await firebaseDataManager.markNotificationAsRead(notificationId);
      this.updateNotificationBadge();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  }

  async updateNotificationBadge() {
    if (!this.currentUser || typeof firebaseDataManager === 'undefined') {
      return;
    }
    
    try {
      const unreadCount = await firebaseDataManager.getUnreadNotificationCount(this.currentUser.uid);
      
      const badge = document.getElementById('notificationBadge');
      const mobileBadge = document.getElementById('mobileNotificationBadge');
      
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
      
      if (mobileBadge) {
        if (unreadCount > 0) {
          mobileBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
          mobileBadge.style.display = 'inline-flex';
        } else {
          mobileBadge.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('알림 배지 업데이트 실패:', error);
    }
  }

  async handleLogoutClick(e) {
    e.preventDefault();
    
    if (typeof firebaseDataManager !== 'undefined') {
      try {
        await firebaseDataManager.signOut();
        window.location.href = 'index.html';
      } catch (error) {
        // console.error('로그아웃 오류:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    }
  }

  openLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    } else {
      window.location.href = 'mypage.html';
    }
  }

  updateLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    const mobileNotificationBtn = document.getElementById('mobileNotificationBtn');
    const mypageBtn = document.getElementById('mypageBtn');
    const mobileMypageBtn = document.getElementById('mobileMypageBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarAuthButtons = document.querySelector('.sidebar-auth-buttons');
    

    if (this.currentUser) {
      const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
      
      if (loginBtn) {
        loginBtn.style.display = 'none';
        loginBtn.style.visibility = 'hidden';
      }

      if (mobileLoginBtn) {
        mobileLoginBtn.style.display = 'none';
        mobileLoginBtn.style.visibility = 'hidden';
      }

      if (notificationBtn) {
        notificationBtn.style.display = 'inline-flex';
        notificationBtn.style.visibility = 'visible';
      }

      if (mobileNotificationBtn) {
        mobileNotificationBtn.style.display = 'flex';
        mobileNotificationBtn.style.visibility = 'visible';
      }

      if (mypageBtn) {
        mypageBtn.style.display = 'inline-flex';
        mypageBtn.style.visibility = 'visible';
        mypageBtn.title = `${displayName}님 (클릭하여 마이페이지)`;
      }

      if (mobileMypageBtn) {
        mobileMypageBtn.style.display = 'flex';
        mobileMypageBtn.style.visibility = 'visible';
        mobileMypageBtn.title = '마이페이지';
      }

      if (logoutBtn) {
        logoutBtn.style.display = 'inline-flex';
        logoutBtn.style.visibility = 'visible';
      }
      
      // 사이드바 인증 버튼 컨테이너 표시
      if (sidebarAuthButtons) {
        sidebarAuthButtons.style.display = 'flex';
      }
    } else {
      if (loginBtn) {
        loginBtn.style.display = 'inline-flex';
        loginBtn.style.visibility = 'visible';
        loginBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket" style="color:rgb(0, 0, 0);"></i><span class="nav-text">로그인</span>`;
        loginBtn.title = '로그인';
        loginBtn.href = '#';
      }

      if (mobileLoginBtn) {
        mobileLoginBtn.style.display = 'flex';
        mobileLoginBtn.style.visibility = 'visible';
        mobileLoginBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket" style="color: #FFD43B;"></i><span>로그인</span>`;
        mobileLoginBtn.title = '로그인';
        mobileLoginBtn.href = '#';
      }

      if (notificationBtn) {
        notificationBtn.style.display = 'none';
        notificationBtn.style.visibility = 'hidden';
      }

      if (mobileNotificationBtn) {
        mobileNotificationBtn.style.display = 'none';
        mobileNotificationBtn.style.visibility = 'hidden';
      }

      if (mypageBtn) {
        mypageBtn.style.display = 'none';
        mypageBtn.style.visibility = 'hidden';
      }

      if (mobileMypageBtn) {
        mobileMypageBtn.style.display = 'none';
        mobileMypageBtn.style.visibility = 'hidden';
      }

      if (logoutBtn) {
        logoutBtn.style.display = 'none';
        logoutBtn.style.visibility = 'hidden';
      }
      
      // 사이드바 인증 버튼 컨테이너 표시 (로그인 버튼이 있으므로)
      if (sidebarAuthButtons) {
        sidebarAuthButtons.style.display = 'flex';
      }
    }
  }

  // 사이드바 관련 함수들은 더 이상 필요하지 않음 (하단 고정 메뉴바 사용)
}

window.HeaderComponent = HeaderComponent;
