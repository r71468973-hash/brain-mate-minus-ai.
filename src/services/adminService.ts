import { AdminStats, RegisteredUser, SupportTicket } from '../types';

export const SUPER_ADMIN_EMAIL = 'r71468973@gmail.com';

class AdminService {
  private tokenKey = 'bm_superadmin_token';
  private emailKey = 'bm_superadmin_email';

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.tokenKey) || localStorage.getItem(this.tokenKey);
  }

  public getAdminEmail(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.emailKey) || localStorage.getItem(this.emailKey);
  }

  public setSession(token: string, email: string) {
    sessionStorage.setItem(this.tokenKey, token);
    sessionStorage.setItem(this.emailKey, email);
  }

  public clearSession() {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.emailKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.emailKey);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['x-admin-token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public async login(email: string, pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Authentication verification failed' };
      }
      this.setSession(data.token, data.email);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error connecting to Admin Server' };
    }
  }

  public async logout(): Promise<void> {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch {}
    this.clearSession();
  }

  public async verifySession(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/admin/verify-session', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return !!data.valid;
      }
      return false;
    } catch {
      return false;
    }
  }

  public async getStats(): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch admin stats');
    }
    return res.json();
  }

  public async getUsers(): Promise<RegisteredUser[]> {
    const res = await fetch('/api/admin/users', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch user directory');
    }
    const data = await res.json();
    return data.users || [];
  }

  public async updateUserStatus(userId: string, status: 'active' | 'suspended', reason?: string): Promise<RegisteredUser> {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update user status');
    }
    return data.user;
  }

  public async deleteUser(userId: string): Promise<void> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }
  }

  public async toggleMaintenance(enabled: boolean, message?: string, reauthPin?: string): Promise<void> {
    const res = await fetch('/api/admin/maintenance', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ enabled, message, reauthPin }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update maintenance mode');
    }
  }

  public async updateSettings(settings: {
    newAnnouncement?: string;
    updatedFlags?: Record<string, boolean>;
    rateLimit?: number;
  }): Promise<void> {
    const res = await fetch('/api/admin/update-settings', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save settings');
    }
  }

  public async getSupportTickets(): Promise<SupportTicket[]> {
    const res = await fetch('/api/admin/support-tickets', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch support tickets');
    }
    const data = await res.json();
    return data.tickets || [];
  }

  public async replySupportTicket(ticketId: string, reply: string, status: 'resolved' | 'in_progress' = 'resolved'): Promise<SupportTicket> {
    const res = await fetch(`/api/admin/support-tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reply, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit ticket reply');
    }
    return data.ticket;
  }

  public async exportBackup(): Promise<Blob> {
    const res = await fetch('/api/admin/export-backup', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to export backup');
    }
    return res.blob();
  }

  public async restoreBackup(backupData: any, reauthPin: string): Promise<void> {
    const res = await fetch('/api/admin/restore-backup', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ backupData, reauthPin }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to restore backup');
    }
  }
}

export const adminService = new AdminService();
