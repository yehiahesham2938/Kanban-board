// Validation utility functions

export const validators = {
  isNotEmpty: (value) => {
    return value != null && String(value).trim().length > 0
  },

  isValidId: (id) => {
    return id != null && typeof id === 'string' && id.length > 0
  },

  isValidList: (list) => {
    return (
      list != null &&
      validators.isValidId(list.id) &&
      validators.isNotEmpty(list.title)
    )
  },

  isValidCard: (card) => {
    return (
      card != null &&
      validators.isValidId(card.id) &&
      validators.isNotEmpty(card.title)
    )
  },
}
