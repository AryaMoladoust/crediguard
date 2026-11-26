import { runAssessment } from './credit-service';
// آخرین تحلیل اعتباری مشتری (در صورت نبودن، تحلیل قطعی ساخته می‌شود)
export async function runAssessmentOnly(userId) { return (await runAssessment(userId, 'customer')).assessment; }
