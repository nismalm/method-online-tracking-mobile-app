// Default values for Diet Chart Builder

export const DEFAULT_DAILY_GOALS = [
  'Drink minimum of 3L of water everyday',
  'Complete minimum 10K steps per day',
  'Sleep atleast 7-8 hours per day',
];

export const DEFAULT_GENERAL_NOTES = [
  'Avoid Carbs (Roti Rice Wheat Bread)',
  'No Cool Drinks & Fruit Juices',
  'No Junks, No Sweets, No Fried Foods',
];

export const DEFAULT_MEAL_NAMES = [
  'Meal 1- Breakfast',
  'Meal 2- Mid Morning Snack',
  'Meal 3- Lunch',
  'Meal 4- Evening Snack',
  'Meal 5- Dinner',
  'Meal 6- Post Dinner',
  'Meal 7- Pre Workout',
  'Meal 8- Post Workout',
];

export const VALIDATION_RULES = {
  clientName: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
  minMeals: 1,
  maxMeals: 8,
};

// Generate unique ID helper
export const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
