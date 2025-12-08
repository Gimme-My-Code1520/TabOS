import { supabase } from './supabase.js';
import { LocalStorage } from './storage.js';

export class HistoryManager {
  constructor() {
    this.localStorage = new LocalStorage('tabos-history');
    this.history = [];
    this.useSupabase = !!supabase;
  }

  async initialize() {
    if (this.useSupabase) {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        await this.loadFromSupabase();
      } else {
        this.history = this.localStorage.get();
      }
    } else {
      this.history = this.localStorage.get();
    }
  }

  async loadFromSupabase() {
    if (!this.useSupabase) return;

    try {
      const { data, error } = await supabase
        .from('browsing_history')
        .select('*')
        .order('visited_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      this.history = data || [];
    } catch (error) {
      console.error('Error loading history:', error);
      this.history = this.localStorage.get();
    }
  }

  async addToHistory(title, url) {
    const historyItem = {
      id: Date.now().toString(),
      title,
      url,
      visited_at: new Date().toISOString()
    };

    if (this.useSupabase) {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          const { data, error } = await supabase
            .from('browsing_history')
            .insert([{
              title,
              url,
              user_id: session.session.user.id
            }])
            .select()
            .single();

          if (error) throw error;
          historyItem.id = data.id;
        } else {
          this.localStorage.add(historyItem);
        }
      } catch (error) {
        console.error('Error adding to history:', error);
        this.localStorage.add(historyItem);
      }
    } else {
      this.localStorage.add(historyItem);
    }

    this.history.unshift(historyItem);
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
  }

  async clearHistory() {
    if (this.useSupabase) {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          const { error } = await supabase
            .from('browsing_history')
            .delete()
            .eq('user_id', session.session.user.id);

          if (error) throw error;
        }
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }

    this.localStorage.clear();
    this.history = [];
  }

  async removeHistoryItem(id) {
    if (this.useSupabase) {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          const { error } = await supabase
            .from('browsing_history')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } else {
          this.localStorage.remove(id);
        }
      } catch (error) {
        console.error('Error removing history item:', error);
        this.localStorage.remove(id);
      }
    } else {
      this.localStorage.remove(id);
    }

    this.history = this.history.filter(h => h.id !== id);
  }

  getAll() {
    return this.history;
  }
}
