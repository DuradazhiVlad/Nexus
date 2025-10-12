import { Group, GroupFilters, SortBy } from '../types';

export class GroupsFilters {
  /**
   * Застосовує всі фільтри (пошук, категорія, тип, членство) до масиву груп.
   */
  static applyFilters(groups: Group[], filters: GroupFilters): Group[] {
    let filtered = [...groups];

    // Фільтр за пошуковим запитом
    if (filters.searchQuery) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }
    
    // Фільтр за категорією
    if (filters.category) {
      filtered = filtered.filter(group => group.category === filters.category);
    }

    // Фільтр за типом (public/private)
    if (filters.type !== 'all') {
      filtered = filtered.filter(group => 
        filters.type === 'public' ? !group.is_private : group.is_private
      );
    }

    // Фільтр за членством
    if (filters.membership !== 'all') {
      filtered = filtered.filter(group => 
        filters.membership === 'member' ? !!group.user_membership : !group.user_membership
      );
    }

    // Застосування сортування
    return this.sortGroups(filtered, filters.sortBy);
  }

  /**
   * Сортує масив груп на основі вказаного критерію.
   */
  static sortGroups(groups: Group[], sortBy: SortBy): Group[] {
    return [...groups].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return (b.member_count || 0) - (a.member_count || 0);
        case 'activity':
          const dateA = new Date(a.last_activity || a.created_at).getTime();
          const dateB = new Date(b.last_activity || b.created_at).getTime();
          return dateB - dateA;
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }
}