import { Group, GroupFilters } from '../types';

export class GroupsFilters {
  /**
   * Застосувати фільтри до списку груп
   */
  static applyFilters(groups: Group[], filters: GroupFilters): Group[] {
    let filtered = [...groups];

    // Пошук
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query) ||
        group.category?.toLowerCase().includes(query) ||
        group.location?.toLowerCase().includes(query)
      );
    }

    // Фільтр по категорії
    if (filters.categoryFilter) {
      filtered = filtered.filter(group => group.category === filters.categoryFilter);
    }

    // Фільтр по типу
    if (filters.typeFilter !== 'all') {
      filtered = filtered.filter(group => {
        if (filters.typeFilter === 'public') return !group.is_private;
        if (filters.typeFilter === 'private') return group.is_private;
        return true;
      });
    }

    // Фільтр по членству
    if (filters.membershipFilter !== 'all') {
      filtered = filtered.filter(group => {
        const isMember = group.user_membership !== null;
        if (filters.membershipFilter === 'member') return isMember;
        if (filters.membershipFilter === 'not_member') return !isMember;
        return true;
      });
    }

    // Сортування
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return (b.member_count || 0) - (a.member_count || 0);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'activity':
        default:
          return new Date(b.last_activity || b.created_at).getTime() - 
                 new Date(a.last_activity || a.created_at).getTime();
      }
    });

    return filtered;
  }

  /**
   * Отримати кількість активних фільтрів
   */
  static getActiveFiltersCount(filters: GroupFilters): number {
    let count = 0;
    
    if (filters.searchQuery) count++;
    if (filters.categoryFilter) count++;
    if (filters.typeFilter !== 'all') count++;
    if (filters.membershipFilter !== 'all') count++;
    
    return count;
  }

  /**
   * Скинути всі фільтри
   */
  static getDefaultFilters(): GroupFilters {
    return {
      searchQuery: '',
      categoryFilter: '',
      typeFilter: 'all',
      membershipFilter: 'all',
      sortBy: 'activity'
    };
  }

  /**
   * Форматувати дату для відображення
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'щойно';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} год. тому`;
    } else if (diffInHours < 168) { // 7 днів
      const days = Math.floor(diffInHours / 24);
      return `${days} дн. тому`;
    } else {
      return date.toLocaleDateString('uk-UA');
    }
  }

  /**
   * Отримати ініціали з імені
   */
  static getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Перевірити чи група є приватною
   */
  static isPrivateGroup(group: Group): boolean {
    return group.is_private === true;
  }

  /**
   * Перевірити чи користувач є членом групи
   */
  static isUserMember(group: Group): boolean {
    return group.user_membership !== null;
  }

  /**
   * Отримати роль користувача в групі
   */
  static getUserRole(group: Group): string | null {
    return group.user_membership?.role || null;
  }
} 