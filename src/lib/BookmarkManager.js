import { supabase } from './supabase.js';
import { LocalStorage } from './storage.js';

export class BookmarkManager {
  constructor() {
    this.localStorage = new LocalStorage('tabos-bookmarks');
    this.bookmarks = [];
    this.useSupabase = !!supabase;
  }

  async initialize() {
    if (this.useSupabase) {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        await this.loadFromSupabase();
      } else {
        this.bookmarks = this.localStorage.get();
      }
    } else {
      this.bookmarks = this.localStorage.get();
    }
  }

  async loadFromSupabase() {
    if (!this.useSupabase) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.bookmarks = data || [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      this.bookmarks = this.localStorage.get();
    }
  }

  async addBookmark(title, url) {
    const bookmark = {
      id: Date.now().toString(),
      title,
      url,
      created_at: new Date().toISOString()
    };

    if (this.useSupabase) {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          const { data, error } = await supabase
            .from('bookmarks')
            .insert([{
              title,
              url,
              user_id: session.session.user.id
            }])
            .select()
            .single();

          if (error) throw error;
          bookmark.id = data.id;
        } else {
          this.localStorage.add(bookmark);
        }
      } catch (error) {
        console.error('Error adding bookmark:', error);
        this.localStorage.add(bookmark);
      }
    } else {
      this.localStorage.add(bookmark);
    }

    this.bookmarks.unshift(bookmark);
    return bookmark;
  }

  async removeBookmark(id) {
    if (this.useSupabase) {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } else {
          this.localStorage.remove(id);
        }
      } catch (error) {
        console.error('Error removing bookmark:', error);
        this.localStorage.remove(id);
      }
    } else {
      this.localStorage.remove(id);
    }

    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
  }

  isBookmarked(url) {
    return this.bookmarks.some(b => b.url === url);
  }

  getBookmarkByUrl(url) {
    return this.bookmarks.find(b => b.url === url);
  }

  getAll() {
    return this.bookmarks;
  }
}
