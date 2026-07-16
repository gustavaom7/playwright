export const users = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
} as const;

export const items = {
  bikeLight: 'Sauce Labs Bike Light',
} as const;

export const checkoutInfo = {
  firstName: 'Gustavo',
  lastName: 'Mesquita',
  zipCode: '37191018',
} as const;
