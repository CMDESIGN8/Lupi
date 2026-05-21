// utils/dailyProgress.ts
export class DailyProgressManager {
  private storageKey: string;
  
  constructor(userId: string) {
    this.storageKey = `campaign_daily_${userId}`;
  }
  
  canPlayToday(): boolean {
    const lastPlayed = localStorage.getItem(`${this.storageKey}_last`);
    const today = new Date().toDateString();
    return lastPlayed !== today;
  }
  
  getDailyStreak(): number {
    const streak = localStorage.getItem(`${this.storageKey}_streak`);
    return streak ? parseInt(streak) : 0;
  }
  
  updateDailyProgress(didPlay: boolean): void {
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem(`${this.storageKey}_last`);
    
    if (lastPlayed === today) return;
    
    let streak = this.getDailyStreak();
    if (lastPlayed && this.isConsecutiveDay(lastPlayed, today)) {
      streak = didPlay ? streak + 1 : 0;
    } else if (didPlay) {
      streak = 1;
    }
    
    localStorage.setItem(`${this.storageKey}_last`, today);
    localStorage.setItem(`${this.storageKey}_streak`, streak.toString());
  }
  
  private isConsecutiveDay(lastDate: string, today: string): boolean {
    const last = new Date(lastDate);
    const now = new Date(today);
    const diffDays = (now.getTime() - last.getTime()) / (1000 * 3600 * 24);
    return diffDays === 1;
  }
}