export class TabManager {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.tabCounter = 0;
    this.listeners = [];
  }

  createTab(url = null) {
    const tabId = ++this.tabCounter;
    const tab = {
      id: tabId,
      title: url ? 'Loading...' : 'New Tab',
      url: url,
      history: [],
      historyIndex: -1,
      canGoBack: false,
      canGoForward: false
    };

    this.tabs.push(tab);
    this.activeTabId = tabId;
    this.notifyListeners();
    return tab;
  }

  closeTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    this.tabs.splice(index, 1);

    if (this.tabs.length === 0) {
      this.createTab();
    } else if (this.activeTabId === tabId) {
      const newIndex = Math.min(index, this.tabs.length - 1);
      this.activeTabId = this.tabs[newIndex].id;
    }

    this.notifyListeners();
  }

  switchTab(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      this.activeTabId = tabId;
      this.notifyListeners();
    }
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId);
  }

  updateTab(tabId, updates) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      Object.assign(tab, updates);
      this.notifyListeners();
    }
  }

  navigateTo(url) {
    const tab = this.getActiveTab();
    if (!tab) return;

    if (tab.historyIndex < tab.history.length - 1) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
    }

    tab.history.push(url);
    tab.historyIndex = tab.history.length - 1;
    tab.url = url;
    tab.canGoBack = tab.historyIndex > 0;
    tab.canGoForward = false;

    this.notifyListeners();
  }

  goBack() {
    const tab = this.getActiveTab();
    if (!tab || !tab.canGoBack) return;

    tab.historyIndex--;
    tab.url = tab.history[tab.historyIndex];
    tab.canGoBack = tab.historyIndex > 0;
    tab.canGoForward = tab.historyIndex < tab.history.length - 1;

    this.notifyListeners();
  }

  goForward() {
    const tab = this.getActiveTab();
    if (!tab || !tab.canGoForward) return;

    tab.historyIndex++;
    tab.url = tab.history[tab.historyIndex];
    tab.canGoBack = tab.historyIndex > 0;
    tab.canGoForward = tab.historyIndex < tab.history.length - 1;

    this.notifyListeners();
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback());
  }
}
