export const formatPrice = (value: number) =>
  value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
