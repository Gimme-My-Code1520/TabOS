import { TabManager } from './lib/TabManager.js';
import { BookmarkManager } from './lib/BookmarkManager.js';
import { HistoryManager } from './lib/HistoryManager.js';

class Browser {
  constructor() {
    this.tabManager = new TabManager();
    this.bookmarkManager = new BookmarkManager();
    this.historyManager = new HistoryManager();

    this.elements = {
      tabs: document.getElementById('tabs'),
      newTabBtn: document.getElementById('new-tab-btn'),
      backBtn: document.getElementById('back-btn'),
      forwardBtn: document.getElementById('forward-btn'),
      refreshBtn: document.getElementById('refresh-btn'),
      homeBtn: document.getElementById('home-btn'),
      addressBar: document.getElementById('address-bar'),
      bookmarkBtn: document.getElementById('bookmark-btn'),
      bookmarksBtn: document.getElementById('bookmarks-btn'),
      historyBtn: document.getElementById('history-btn'),
      settingsBtn: document.getElementById('settings-btn'),
      contentArea: document.getElementById('content-area'),
      sidebar: document.getElementById('sidebar'),
      sidebarTitle: document.getElementById('sidebar-title'),
      sidebarContent: document.getElementById('sidebar-content'),
      closeSidebar: document.getElementById('close-sidebar')
    };

    this.defaultSearchEngine = 'https://duckduckgo.com/?q=';
    this.homeUrl = 'about:newtab';
  }

  async init() {
    await this.bookmarkManager.initialize();
    await this.historyManager.initialize();

    this.setupEventListeners();
    this.tabManager.createTab();
    this.render();
  }

  setupEventListeners() {
    this.elements.newTabBtn.addEventListener('click', () => this.createNewTab());
    this.elements.backBtn.addEventListener('click', () => this.goBack());
    this.elements.forwardBtn.addEventListener('click', () => this.goForward());
    this.elements.refreshBtn.addEventListener('click', () => this.refresh());
    this.elements.homeBtn.addEventListener('click', () => this.goHome());

    this.elements.addressBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigate(this.elements.addressBar.value);
      }
    });

    this.elements.bookmarkBtn.addEventListener('click', () => this.toggleBookmark());
    this.elements.bookmarksBtn.addEventListener('click', () => this.showBookmarks());
    this.elements.historyBtn.addEventListener('click', () => this.showHistory());
    this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
    this.elements.closeSidebar.addEventListener('click', () => this.closeSidebar());

    this.tabManager.onChange(() => this.render());
  }

  createNewTab() {
    this.tabManager.createTab();
  }

  goBack() {
    this.tabManager.goBack();
    const tab = this.tabManager.getActiveTab();
    if (tab && tab.url) {
      this.loadUrl(tab.url);
    }
  }

  goForward() {
    this.tabManager.goForward();
    const tab = this.tabManager.getActiveTab();
    if (tab && tab.url) {
      this.loadUrl(tab.url);
    }
  }

  refresh() {
    const tab = this.tabManager.getActiveTab();
    if (tab && tab.url && tab.url !== 'about:newtab') {
      const iframe = this.getTabFrame(tab.id);
      if (iframe) {
        iframe.src = iframe.src;
      }
    }
  }

  goHome() {
    this.navigate('about:newtab');
  }

  navigate(input) {
    if (!input.trim()) return;

    let url = input.trim();

    if (url === 'about:newtab') {
      this.tabManager.navigateTo(url);
      return;
    }

    if (!url.match(/^https?:\/\//)) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        url = this.defaultSearchEngine + encodeURIComponent(url);
      }
    }

    this.tabManager.navigateTo(url);
    this.loadUrl(url);
  }

  loadUrl(url) {
    const tab = this.tabManager.getActiveTab();
    if (!tab) return;

    if (url === 'about:newtab') {
      this.render();
      return;
    }

    const iframe = this.getTabFrame(tab.id);
    if (iframe) {
      iframe.src = url;

      iframe.onload = () => {
        try {
          const title = iframe.contentDocument?.title || url;
          this.tabManager.updateTab(tab.id, { title });
          this.historyManager.addToHistory(title, url);
        } catch (e) {
          this.tabManager.updateTab(tab.id, { title: url });
          this.historyManager.addToHistory(url, url);
        }
      };

      iframe.onerror = () => {
        this.tabManager.updateTab(tab.id, { title: 'Failed to load' });
      };
    }
  }

  getTabFrame(tabId) {
    let iframe = document.getElementById(`frame-${tabId}`);
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = `frame-${tabId}`;
      iframe.className = 'browser-frame';
      iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox';
      this.elements.contentArea.appendChild(iframe);
    }
    return iframe;
  }

  async toggleBookmark() {
    const tab = this.tabManager.getActiveTab();
    if (!tab || !tab.url || tab.url === 'about:newtab') return;

    if (this.bookmarkManager.isBookmarked(tab.url)) {
      const bookmark = this.bookmarkManager.getBookmarkByUrl(tab.url);
      await this.bookmarkManager.removeBookmark(bookmark.id);
    } else {
      await this.bookmarkManager.addBookmark(tab.title, tab.url);
    }

    this.updateBookmarkButton();
  }

  updateBookmarkButton() {
    const tab = this.tabManager.getActiveTab();
    if (tab && tab.url && this.bookmarkManager.isBookmarked(tab.url)) {
      this.elements.bookmarkBtn.classList.add('bookmarked');
    } else {
      this.elements.bookmarkBtn.classList.remove('bookmarked');
    }
  }

  showBookmarks() {
    this.elements.sidebarTitle.textContent = 'Bookmarks';
    this.elements.sidebar.classList.remove('hidden');

    const bookmarks = this.bookmarkManager.getAll();

    if (bookmarks.length === 0) {
      this.elements.sidebarContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-text">No bookmarks yet. Click the star icon in the address bar to bookmark a page.</div>
        </div>
      `;
      return;
    }

    this.elements.sidebarContent.innerHTML = bookmarks.map(bookmark => `
      <div class="bookmark-item" data-url="${bookmark.url}">
        <div class="bookmark-info">
          <div class="bookmark-title">${this.escapeHtml(bookmark.title)}</div>
          <div class="bookmark-url">${this.escapeHtml(bookmark.url)}</div>
        </div>
        <button class="delete-bookmark" data-id="${bookmark.id}">×</button>
      </div>
    `).join('');

    this.elements.sidebarContent.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-bookmark')) {
          this.navigate(item.dataset.url);
          this.closeSidebar();
        }
      });
    });

    this.elements.sidebarContent.querySelectorAll('.delete-bookmark').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.bookmarkManager.removeBookmark(btn.dataset.id);
        this.showBookmarks();
        this.updateBookmarkButton();
      });
    });
  }

  showHistory() {
    this.elements.sidebarTitle.textContent = 'History';
    this.elements.sidebar.classList.remove('hidden');

    const history = this.historyManager.getAll();

    if (history.length === 0) {
      this.elements.sidebarContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🕒</div>
          <div class="empty-state-text">No browsing history yet.</div>
        </div>
      `;
      return;
    }

    this.elements.sidebarContent.innerHTML = history.map(item => `
      <div class="history-item" data-url="${item.url}">
        <div class="history-info">
          <div class="history-title">${this.escapeHtml(item.title)}</div>
          <div class="history-url">${this.escapeHtml(item.url)}</div>
          <div class="history-time">${this.formatTime(item.visited_at)}</div>
        </div>
        <button class="delete-history" data-id="${item.id}">×</button>
      </div>
    `).join('');

    this.elements.sidebarContent.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-history')) {
          this.navigate(item.dataset.url);
          this.closeSidebar();
        }
      });
    });

    this.elements.sidebarContent.querySelectorAll('.delete-history').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.historyManager.removeHistoryItem(btn.dataset.id);
        this.showHistory();
      });
    });
  }

  showSettings() {
    this.elements.sidebarTitle.textContent = 'Settings';
    this.elements.sidebar.classList.remove('hidden');

    this.elements.sidebarContent.innerHTML = `
      <div class="settings-section">
        <h3>Browser Information</h3>
        <div class="settings-item">
          <span class="settings-label">Browser Name</span>
          <span class="settings-value">TabOS Browser</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Version</span>
          <span class="settings-value">1.0.0</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Default Search</span>
          <span class="settings-value">DuckDuckGo</span>
        </div>
      </div>

      <div class="settings-section">
        <h3>Privacy</h3>
        <div class="settings-item">
          <span class="settings-label">Bookmarks</span>
          <span class="settings-value">${this.bookmarkManager.getAll().length} saved</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">History Items</span>
          <span class="settings-value">${this.historyManager.getAll().length} items</span>
        </div>
      </div>

      <div class="settings-section">
        <h3>Clear Data</h3>
        <div class="settings-item">
          <button class="btn-clear" id="clear-history-btn">Clear Browsing History</button>
        </div>
      </div>
    `;

    document.getElementById('clear-history-btn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your browsing history?')) {
        await this.historyManager.clearHistory();
        this.showSettings();
      }
    });
  }

  closeSidebar() {
    this.elements.sidebar.classList.add('hidden');
  }

  render() {
    this.renderTabs();
    this.renderContent();
    this.updateControls();
    this.updateBookmarkButton();
  }

  renderTabs() {
    this.elements.tabs.innerHTML = this.tabManager.tabs.map(tab => `
      <div class="tab ${tab.id === this.tabManager.activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
        <span class="tab-title">${this.escapeHtml(tab.title)}</span>
        <button class="tab-close" data-tab-id="${tab.id}">×</button>
      </div>
    `).join('');

    this.elements.tabs.querySelectorAll('.tab').forEach(tabEl => {
      tabEl.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          const tabId = parseInt(tabEl.dataset.tabId);
          this.tabManager.switchTab(tabId);
        }
      });
    });

    this.elements.tabs.querySelectorAll('.tab-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabId = parseInt(btn.dataset.tabId);
        this.tabManager.closeTab(tabId);
        const frame = document.getElementById(`frame-${tabId}`);
        if (frame) frame.remove();
        const newTabPage = document.getElementById(`newtab-${tabId}`);
        if (newTabPage) newTabPage.remove();
      });
    });
  }

  renderContent() {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    this.elements.addressBar.value = activeTab.url === 'about:newtab' ? '' : activeTab.url || '';

    document.querySelectorAll('.browser-frame').forEach(frame => {
      frame.classList.remove('active');
    });

    document.querySelectorAll('.new-tab-page').forEach(page => {
      page.classList.remove('active');
    });

    if (activeTab.url === 'about:newtab' || !activeTab.url) {
      this.showNewTabPage(activeTab.id);
    } else {
      const iframe = this.getTabFrame(activeTab.id);
      iframe.classList.add('active');
    }
  }

  showNewTabPage(tabId) {
    let newTabPage = document.getElementById(`newtab-${tabId}`);

    if (!newTabPage) {
      newTabPage = document.createElement('div');
      newTabPage.id = `newtab-${tabId}`;
      newTabPage.className = 'new-tab-page';
      newTabPage.innerHTML = `
        <div class="new-tab-logo">🌐</div>
        <h1 class="new-tab-title">TabOS Browser</h1>
        <input type="text" class="new-tab-search" placeholder="Search DuckDuckGo or enter URL...">
        <div class="quick-links">
          <a href="#" class="quick-link" data-url="https://duckduckgo.com">
            <div class="quick-link-icon">🔍</div>
            <div class="quick-link-title">DuckDuckGo</div>
          </a>
          <a href="#" class="quick-link" data-url="https://wikipedia.org">
            <div class="quick-link-icon">📚</div>
            <div class="quick-link-title">Wikipedia</div>
          </a>
          <a href="#" class="quick-link" data-url="https://archive.org">
            <div class="quick-link-icon">📦</div>
            <div class="quick-link-title">Internet Archive</div>
          </a>
          <a href="#" class="quick-link" data-url="https://reddit.com">
            <div class="quick-link-icon">💬</div>
            <div class="quick-link-title">Reddit</div>
          </a>
        </div>
      `;

      this.elements.contentArea.appendChild(newTabPage);

      const searchInput = newTabPage.querySelector('.new-tab-search');
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.navigate(searchInput.value);
        }
      });

      newTabPage.querySelectorAll('.quick-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.navigate(link.dataset.url);
        });
      });
    }

    newTabPage.classList.add('active');
  }

  updateControls() {
    const tab = this.tabManager.getActiveTab();

    this.elements.backBtn.disabled = !tab?.canGoBack;
    this.elements.forwardBtn.disabled = !tab?.canGoForward;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

const browser = new Browser();
browser.init();
