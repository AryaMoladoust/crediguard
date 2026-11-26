import assert from 'node:assert/strict';
import { generateCreditData } from '../src/lib/credit-sim.js';
import { analyzeCredit } from '../src/lib/credit-agent.js';

const a = generateCreditData('demo-user-1');
const b = generateCreditData('demo-user-1');
assert.deepEqual(a, b, 'synthetic data must be deterministic for the same user key');
const result = analyzeCredit(a);
assert.ok(result.score >= 300 && result.score <= 900, 'score must be within 300..900');
assert.ok(['low', 'medium', 'high', 'critical'].includes(result.riskLevel));
assert.ok(['approve', 'review', 'reject'].includes(result.recommendation));
assert.ok(Number.isFinite(result.creditLimit) && result.creditLimit >= 0);
assert.ok(Array.isArray(result.reasons) && Array.isArray(result.flags));
console.log('✔ credit engine smoke test passed');
