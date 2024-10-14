// sortingUtils.js

/**
 * A generic sorting function that sorts items based on the given configuration.
 * @param {Array} items - Array of objects to be sorted.
 * @param {Array} criteria - An array of sorting criteria. Each criterion should be an object with 'field' and 'order'.
 * Example: [{ field: 'Status', order: 'custom', customOrder: ['Done', 'In Progress', 'To Do']}, { field: 'Priority', order: 'asc' }]
 */
export function sortItems(items, criteria) {
    return items.sort((a, b) => {
      for (let criterion of criteria) {
        const { field, order, customOrder } = criterion;
  
        let valueA = a[field];
        let valueB = b[field];
  
        if (order === 'custom' && customOrder) {
          const indexA = customOrder.indexOf(valueA) >= 0 ? customOrder.indexOf(valueA) : customOrder.length;
          const indexB = customOrder.indexOf(valueB) >= 0 ? customOrder.indexOf(valueB) : customOrder.length;
          if (indexA !== indexB) return indexA - indexB;
        } else if (order === 'asc' || order === 'desc') {
          if (valueA < valueB) return order === 'asc' ? -1 : 1;
          if (valueA > valueB) return order === 'asc' ? 1 : -1;
        }
      }
      return 0; // If equal, move to the next criteria or leave items in place
    });
  }
  