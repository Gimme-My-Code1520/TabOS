export class LocalStorage {
  constructor(key) {
    this.key = key;
  }

  get() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  set(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  add(item) {
    const data = this.get();
    data.push(item);
    this.set(data);
  }

  remove(id) {
    const data = this.get();
    const filtered = data.filter(item => item.id !== id);
    this.set(filtered);
  }

  clear() {
    this.set([]);
  }
}
