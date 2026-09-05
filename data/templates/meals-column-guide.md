# DinnerRoll CSV Meal Import Column Guide

This guide details the supported columns when importing meals into DinnerRoll via CSV.

## Required Columns

| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `Name` | Text | The clear, human-readable name of the dish. | `Lemon Herb Roast Chicken` |
| `Category` | Text | The primary meal group (e.g., Chicken, Beef, Pork, Fish, Vegetarian, Other). | `Chicken` |
| `Servings` | Integer | Total portions produced when cooked. Used to calculate leftover allocations. | `4` |
| `UseByDays` | Integer | Food-safe shelf-life in days after cooking. Leftovers will not be scheduled beyond this window. | `3` |
| `MealTypes` | Text | Eligible meal periods, separated by commas or semicolons. Values: `Breakfast`, `Lunch`, `Dinner`. | `Dinner` or `Lunch,Dinner` |

## Optional Columns

| Column Name | Type | Description | Default | Example |
| :--- | :--- | :--- | :--- | :--- |
| `MinimumRepeatWeeks` | Integer | Override the household default minimum weeks between occurrences of this dish. | Household default (3) | `6` |
| `CaloriesPerServing` | Number | Approximate calories per single serving portion. | None | `520` |
| `ProteinGramsPerServing`| Number | Grams of protein per single serving portion. | None | `42` |
| `FatGramsPerServing` | Number | Grams of fat per single serving portion. | None | `22` |
| `CarbsGramsPerServing` | Number | Grams of carbohydrates per single serving portion. | None | `12` |
| `RecipeId` | Text | Identifier linking to recipe and ingredient records for grocery scaling. | None | `recipe-lemon-herb-chicken` |
| `Enabled` | Boolean | Set to `false` to temporarily exclude a dish without deleting it. | `true` | `true` |
| `WeightModifier` | Number | Relative multiplier for selection probability (e.g. 1.5 for +50%, 0.7 for -30%). | `1.0` | `1.2` |
| `Id` | Text | Stable unique identifier for the dish. Generated automatically if omitted. | Auto-generated | `meal-chicken-lemon-herb` |
