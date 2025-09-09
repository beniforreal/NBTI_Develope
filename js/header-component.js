class HeaderComponent {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.createHeaderHTML();
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
                사진첩
              </a>
              <a href="members.html" class="nav-link" data-page="members">👥 길드원</a>
              <div class="auth-buttons">
                <a href="#" class="nav-link login-btn" id="loginBtn" title="로그인">
                  <i class="fa-solid fa-right-to-bracket" style="color:rgb(0, 0, 0);"></i>
                  <span class="nav-text">로그인</span>
                </a>
                <a href="mypage.html" class="nav-link mypage-btn" id="mypageBtn" title="마이페이지" style="display: none;">
                  <i class="fa-solid fa-user" style="color: #4CAF50;"></i>
                  <span class="nav-text">마이페이지</span>
                </a>
                <a href="#" class="nav-link logout-btn" id="logoutBtn" title="로그아웃" style="display: none;">
                  <i class="fa-solid fa-sign-out-alt" style="color: #ff4444;"></i>
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

        <!-- 모바일 사이드바 -->
        <div class="mobile-sidebar" id="mobileSidebar">
          <div class="sidebar-header">
            <a href="index.html" class="sidebar-logo">
              <h2>🏰 NBTI 길드</h2>
            </a>
            <button class="sidebar-close" id="sidebarClose">&times;</button>
          </div>
          <nav class="sidebar-nav">
            <a href="picture.html" class="sidebar-link" data-page="picture">
              <i class="fa-solid fa-camera" style="color: #ff6b9d;"></i>
              <span>사진첩</span>
            </a>
            <a href="members.html" class="sidebar-link" data-page="members">
              <i class="fa-solid fa-users" style="color: #4dabf7;"></i>
              <span>길드원</span>
            </a>
            <div class="sidebar-auth-buttons">
              <a href="#" class="sidebar-link login-btn" id="mobileLoginBtn" title="로그인" style="display: flex;">
                <i class="fa-solid fa-right-to-bracket" style="color: #FFD43B;"></i>
                <span>로그인</span>
              </a>
              <a href="mypage.html" class="sidebar-link mypage-btn" id="mobileMypageBtn" title="마이페이지" style="display: none;">
                <i class="fa-solid fa-user" style="color: #4CAF50;"></i>
                <span>마이페이지</span>
              </a>
              <a href="#" class="sidebar-link logout-btn" id="mobileLogoutBtn" title="로그아웃" style="display: none;">
                <i class="fa-solid fa-sign-out-alt" style="color: #ff4444;"></i>
                <span>로그아웃</span>
              </a>
            </div>
          </nav>
        </div>

        <!-- 모바일 사이드바 오버레이 -->
        <div class="mobile-sidebar-overlay" id="mobileSidebarOverlay"></div>
      </header>
    `;

    const existingHeader = document.querySelector('.header');
    if (existingHeader) {
      existingHeader.remove();
    }

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
  }

  attachEventListeners() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarClose = document.getElementById('sidebarClose');
    const mobileSidebarOverlay = document.getElementById('mobileSidebarOverlay');

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => this.openSidebar());
    }

    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => this.closeSidebar());
    }

    if (mobileSidebarOverlay) {
      mobileSidebarOverlay.addEventListener('click', () => this.closeSidebar());
    }

    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mypageBtn = document.getElementById('mypageBtn');
    const mobileMypageBtn = document.getElementById('mobileMypageBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => this.handleLoginClick(e));
    }

    if (mobileLoginBtn) {
      mobileLoginBtn.addEventListener('click', (e) => this.handleLoginClick(e));
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => this.handleLogoutClick(e));
    }

    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', (e) => this.handleLogoutClick(e));
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
    const mypageBtn = document.getElementById('mypageBtn');
    const mobileMypageBtn = document.getElementById('mobileMypageBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
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

      if (mobileLogoutBtn) {
        mobileLogoutBtn.style.display = 'flex';
        mobileLogoutBtn.style.visibility = 'visible';
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

      if (mobileLogoutBtn) {
        mobileLogoutBtn.style.display = 'none';
        mobileLogoutBtn.style.visibility = 'hidden';
      }
      
      // 사이드바 인증 버튼 컨테이너 표시 (로그인 버튼이 있으므로)
      if (sidebarAuthButtons) {
        sidebarAuthButtons.style.display = 'flex';
      }
    }
  }

  openSidebar() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarOverlay = document.getElementById('mobileSidebarOverlay');
    
    if (mobileSidebar && mobileSidebarOverlay) {
      mobileSidebar.classList.add('active');
      mobileSidebarOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeSidebar() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarOverlay = document.getElementById('mobileSidebarOverlay');
    
    if (mobileSidebar && mobileSidebarOverlay) {
      mobileSidebar.classList.remove('active');
      mobileSidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

window.HeaderComponent = HeaderComponent;
