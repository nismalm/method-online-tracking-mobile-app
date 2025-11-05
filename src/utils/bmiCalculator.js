// // BMI Calculation Helper Functions
// // Based on WHO standards and medical guidelines

// // BMI Category Constants
// const BMI_CATEGORIES = {
//   UNDERWEIGHT: { min: 0, max: 18.4, category: 'Underweight', remark: 'Below normal weight range', color: '#3B82F6' },
//   NORMAL: { min: 18.5, max: 24.9, category: 'Normal', remark: 'Healthy weight range', color: '#10B981' },
//   OVERWEIGHT: { min: 25.0, max: 29.9, category: 'Overweight', remark: 'Above normal weight range', color: '#F59E0B' },
//   OBESE_I: { min: 30.0, max: 34.9, category: 'Obese Class I', remark: 'Moderately obese', color: '#EF4444' },
//   OBESE_II: { min: 35.0, max: 39.9, category: 'Obese Class II', remark: 'Severely obese', color: '#DC2626' },
//   OBESE_III: { min: 40.0, max: 999, category: 'Obese Class III', remark: 'Very severely obese', color: '#991B1B' }
// };

// // Target BMI Ranges
// const TARGET_BMI_RANGES = {
//   ADULT: { min: 18.5, max: 24.9 },
//   SENIOR: { min: 18.5, max: 27.0 } // For adults 65+
// };

// // Age Thresholds
// const AGE_THRESHOLDS = {
//   SENIOR: 65
// };

// /**
//  * Calculate BMI (Body Mass Index)
//  * @param {number} weight - Weight in kg
//  * @param {number} height - Height in cm
//  * @returns {number} BMI value
//  */
// export const calculateBMI = (weight, height) => {
//   if (!weight || !height || weight <= 0 || height <= 0) {
//     return 0;
//   }

//   // Convert height from cm to meters
//   const heightInMeters = height / 100;

//   // BMI = weight(kg) / height(m)²
//   const bmi = weight / (heightInMeters * heightInMeters);

//   return Math.round(bmi * 10) / 10; // Round to 1 decimal place
// };

// /**
//  * Get BMI category and remark using constants
//  * @param {number} bmi - BMI value
//  * @param {number} age - Age in years
//  * @returns {object} BMI category information
//  */
// export const getBMICategory = (bmi, age) => {
//   if (!bmi || bmi <= 0) {
//     return {
//       category: 'Unknown',
//       remark: 'Unable to calculate BMI',
//       color: '#6B7280'
//     };
//   }

//   // Find the appropriate category using constants
//   for (const [, category] of Object.entries(BMI_CATEGORIES)) {
//     if (bmi >= category.min && bmi <= category.max) {
//       return {
//         category: category.category,
//         remark: category.remark,
//         color: category.color
//       };
//     }
//   }

//   // Fallback (should not reach here with proper constants)
//   return {
//     category: 'Unknown',
//     remark: 'BMI value out of range',
//     color: '#6B7280'
//   };
// };

// /**
//  * Calculate target weight based on BMI and height
//  * @param {number} height - Height in cm
//  * @param {number} currentWeight - Current weight in kg
//  * @param {string} gender - Gender (Male/Female)
//  * @param {number} age - Age in years
//  * @returns {object} Target weight information
//  */
// export const calculateTargetWeight = (height, currentWeight, gender, age) => {
//   if (!height || !currentWeight || height <= 0 || currentWeight <= 0) {
//     return {
//       targetWeight: 0,
//       weightToLose: 0,
//       weightToGain: 0,
//       recommendation: 'Unable to calculate target weight'
//     };
//   }

//   const heightInMeters = height / 100;
//   const currentBMI = calculateBMI(currentWeight, height);

//   // Target BMI ranges (healthy range) - using constants
//   let targetBMIMin = TARGET_BMI_RANGES.ADULT.min;
//   let targetBMIMax = TARGET_BMI_RANGES.ADULT.max;

//   // Adjust for age if needed (older adults might have slightly higher targets)
//   if (age >= AGE_THRESHOLDS.SENIOR) {
//     targetBMIMin = TARGET_BMI_RANGES.SENIOR.min;
//     targetBMIMax = TARGET_BMI_RANGES.SENIOR.max;
//   }

//   const targetWeightMin = targetBMIMin * (heightInMeters * heightInMeters);
//   const targetWeightMax = targetBMIMax * (heightInMeters * heightInMeters);
//   const targetWeight = Math.round(((targetWeightMin + targetWeightMax) / 2) * 10) / 10;

//   const weightDifference = currentWeight - targetWeight;

//   let recommendation = '';
//   let weightToLose = 0;
//   let weightToGain = 0;

//   if (weightDifference > 0) {
//     weightToLose = Math.round(weightDifference * 10) / 10;
//     recommendation = `Aim to lose ${weightToLose} kg to reach healthy weight range`;
//   } else if (weightDifference < 0) {
//     weightToGain = Math.round(Math.abs(weightDifference) * 10) / 10;
//     recommendation = `Aim to gain ${weightToGain} kg to reach healthy weight range`;
//   } else {
//     recommendation = 'You are already in the healthy weight range!';
//   }

//   return {
//     targetWeight,
//     targetWeightRange: {
//       min: Math.round(targetWeightMin * 10) / 10,
//       max: Math.round(targetWeightMax * 10) / 10
//     },
//     weightToLose,
//     weightToGain,
//     recommendation,
//     currentBMI,
//     targetBMIRange: {
//       min: targetBMIMin,
//       max: targetBMIMax
//     }
//   };
// };

// /**
//  * Complete BMI analysis
//  * @param {number} weight - Weight in kg
//  * @param {number} height - Height in cm
//  * @param {string} gender - Gender (Male/Female)
//  * @param {number} age - Age in years
//  * @returns {object} Complete BMI analysis
//  */
// export const getCompleteBMIAnalysis = (weight, height, gender, age) => {
//   const bmi = calculateBMI(weight, height);
//   const bmiCategory = getBMICategory(bmi, age);
//   const targetWeightInfo = calculateTargetWeight(height, weight, gender, age);

//   return {
//     bmi,
//     category: bmiCategory.category,
//     remark: bmiCategory.remark,
//     color: bmiCategory.color,
//     targetWeight: targetWeightInfo.targetWeight,
//     targetWeightRange: targetWeightInfo.targetWeightRange,
//     weightToLose: targetWeightInfo.weightToLose,
//     weightToGain: targetWeightInfo.weightToGain,
//     recommendation: targetWeightInfo.recommendation,
//     currentBMI: targetWeightInfo.currentBMI,
//     targetBMIRange: targetWeightInfo.targetBMIRange
//   };
// };

/**
 * BMI Calculation Helper Functions
 * Refined: Removed arbitrary average target weight; uses range-based targets only.
 * Author: Nismal
 */

// BMI Category Constants
const BMI_CATEGORIES = {
  UNDERWEIGHT: { min: 0, max: 18.4, category: 'Underweight', remark: 'Below normal weight range', color: '#3B82F6' },
  NORMAL: { min: 18.5, max: 24.9, category: 'Normal', remark: 'Healthy weight range', color: '#10B981' },
  OVERWEIGHT: { min: 25.0, max: 29.9, category: 'Overweight', remark: 'Above normal weight range', color: '#F59E0B' },
  OBESE_I: { min: 30.0, max: 34.9, category: 'Obese Class I', remark: 'Moderately obese', color: '#EF4444' },
  OBESE_II: { min: 35.0, max: 39.9, category: 'Obese Class II', remark: 'Severely obese', color: '#DC2626' },
  OBESE_III: { min: 40.0, max: 999, category: 'Obese Class III', remark: 'Very severely obese', color: '#991B1B' },
};

// Target BMI Ranges
const TARGET_BMI_RANGES = {
  ADULT: { min: 18.5, max: 24.9 },
  SENIOR: { min: 18.5, max: 27.0 }, // for adults 65+
};

// Age Thresholds
const AGE_THRESHOLDS = { SENIOR: 65 };

/**
 * Calculate BMI (Body Mass Index)
 */
export const calculateBMI = (weight, height) => {
  if (!weight || !height || weight <= 0 || height <= 0) {return 0;}

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  return Math.round(bmi * 10) / 10;
};

/**
 * Get BMI Category
 */
export const getBMICategory = (bmi) => {
  if (!bmi || bmi <= 0) {
    return { category: 'Unknown', remark: 'Unable to calculate BMI', color: '#6B7280' };
  }

  for (const [, category] of Object.entries(BMI_CATEGORIES)) {
    if (bmi >= category.min && bmi <= category.max) {
      return {
        category: category.category,
        remark: category.remark,
        color: category.color,
      };
    }
  }

  return { category: 'Unknown', remark: 'BMI out of range', color: '#6B7280' };
};

/**
 * Calculate Target Weight Range and Recommendation
 */
export const calculateTargetWeight = (height, currentWeight, gender, age) => {
  if (!height || !currentWeight || height <= 0 || currentWeight <= 0) {
    return {
      targetWeightRange: { min: 0, max: 0 },
      weightToLose: 0,
      weightToGain: 0,
      recommendation: 'Unable to calculate target weight range',
      currentBMI: 0,
      targetBMIRange: { min: 0, max: 0 },
    };
  }

  const heightInMeters = height / 100;
  const currentBMI = calculateBMI(currentWeight, height);

  // Determine target BMI range based on age
  const targetRange =
    age >= AGE_THRESHOLDS.SENIOR
      ? TARGET_BMI_RANGES.SENIOR
      : TARGET_BMI_RANGES.ADULT;

  const targetWeightMin = targetRange.min * (heightInMeters * heightInMeters);
  const targetWeightMax = targetRange.max * (heightInMeters * heightInMeters);

  let recommendation = '';
  let weightToLose = 0;
  let weightToGain = 0;

  if (currentBMI > targetRange.max) {
    const targetWeightUpper = Math.round(targetWeightMax * 10) / 10;
    weightToLose = Math.round((currentWeight - targetWeightUpper) * 10) / 10;
    recommendation = `Aim to lose around ${weightToLose} kg to reach a healthy range.`;
  } else if (currentBMI < targetRange.min) {
    const targetWeightLower = Math.round(targetWeightMin * 10) / 10;
    weightToGain = Math.round((targetWeightLower - currentWeight) * 10) / 10;
    recommendation = `Aim to gain around ${weightToGain} kg to reach a healthy range.`;
  } else {
    recommendation = 'You are within the healthy weight range.';
  }

  return {
    currentBMI,
    targetBMIRange: targetRange,
    targetWeightRange: {
      min: Math.round(targetWeightMin * 10) / 10,
      max: Math.round(targetWeightMax * 10) / 10,
    },
    weightToLose,
    weightToGain,
    recommendation,
  };
};

/**
 * Complete BMI Analysis
 */
export const getCompleteBMIAnalysis = (weight, height, gender, age) => {
  const bmi = calculateBMI(weight, height);
  const bmiCategory = getBMICategory(bmi);
  const targetInfo = calculateTargetWeight(height, weight, gender, age);

  return {
    bmi,
    category: bmiCategory.category,
    remark: bmiCategory.remark,
    color: bmiCategory.color,
    currentBMI: targetInfo.currentBMI,
    targetBMIRange: targetInfo.targetBMIRange,
    targetWeightRange: targetInfo.targetWeightRange,
    weightToLose: targetInfo.weightToLose,
    weightToGain: targetInfo.weightToGain,
    recommendation: targetInfo.recommendation,
  };
};
