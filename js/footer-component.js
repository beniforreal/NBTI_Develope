class FooterComponent {
  constructor() {
    this.footerId = 'footer-component';
    this.init();
  }

  init() {
    if (document.getElementById(this.footerId)) {
      return;
    }

    this.createFooter();
    this.insertFooter();
  }

  createFooter() {
    const footer = document.createElement('footer');
    footer.id = this.footerId;
    footer.className = 'site-footer';
    
    footer.innerHTML = `
      <div class="footer-content">
        <div class="footer-info">
          <h3>NBTI 길드</h3>
          <p>마비노기 모바일 던컨 서버</p>
        </div>
        <div class="footer-links">
          <a href="./index.html">홈</a>
          <a href="./members.html">길드원</a>
          <a href="./picture.html">사진첩</a>
          <a href="./mypage.html">마이페이지</a>
        </div>
        <div class="footer-copyright">
          <p>&copy; 2024 NBTI 길드. All rights reserved.</p>
        </div>
      </div>
    `;

    this.footerElement = footer;
  }

  insertFooter() {
    document.body.appendChild(this.footerElement);
  }

  remove() {
    const footer = document.getElementById(this.footerId);
    if (footer) {
      footer.remove();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new FooterComponent();
});
