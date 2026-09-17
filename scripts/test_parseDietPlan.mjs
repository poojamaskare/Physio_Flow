// node scripts/test_parseDietPlan.mjs — smallest check that the diet text parser still splits meals correctly.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../src/app/components/DietPlanView.tsx', import.meta.url), 'utf8')
const fn = src.slice(src.indexOf('export function parseDietPlan'), src.indexOf('// First dish'))
    .replace('export function', 'function').replace(/: Meal\[\]/g, '').replace(/\(text: string\)/, '(text)').replace(/const meals: Meal\[\]/, 'const meals')
const parseDietPlan = new Function(fn + '; return parseDietPlan')()
const meals = parseDietPlan(`Breakfast:\n- 2 Idli with Sambar\n- Tea\n\nLunch:\n• Roti\n`)
assert.equal(meals.length, 2)
assert.deepEqual(meals[0], { title: 'Breakfast', items: ['2 Idli with Sambar', 'Tea'] })
assert.deepEqual(meals[1], { title: 'Lunch', items: ['Roti'] })
assert.deepEqual(parseDietPlan('just eat well'), [{ title: 'Plan', items: ['just eat well'] }])
console.log('parseDietPlan ok')
