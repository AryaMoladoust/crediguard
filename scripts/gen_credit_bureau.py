#!/usr/bin/env python3
"""شبیه‌ساز داده اعتبارسنجی (مصنوعی). استفاده: python3 gen_credit_bureau.py 100 out.json"""
import random, json, math, sys
N = int(sys.argv[1]) if len(sys.argv) > 1 else 100
OUT = sys.argv[2] if len(sys.argv) > 2 else f"credit-bureau-sample-{N}.json"
random.seed(1405)

F = ["علی","محمد","رضا","حسین","امیر","مهدی","سارا","مریم","زهرا","فاطمه","نیلوفر","پریسا","کیان","آرمان","ندا","الهام","بهزاد","شیما","حمید","سعید","مینا","نرگس","پویا","یاسمن","داود","لیلا"]
L = ["احمدی","رضایی","کریمی","موسوی","حسینی","محمدی","صادقی","جعفری","نظری","قاسمی","رحیمی","باقری","اکبری","یزدانی","حیدری","شریفی","کاظمی","مرادی","عباسی","فتحی"]
EMP = ["کارمند","آزاد","کارگر","بازنشسته","دانشجو","شغل‌دار-خصوصی"]
PLACES = {  # استان: (وزن، شهرها)
 "تهران": (20, ["تهران","شهریار","ری","اسلامشهر"]), "اصفهان": (8, ["اصفهان","کاشان","نجف‌آباد"]),
 "خراسان رضوی": (8, ["مشهد","نیشابور","سبزوار"]), "فارس": (6, ["شیراز","مرودشت","جهرم"]),
 "آذربایجان شرقی": (6, ["تبریز","مراغه"]), "خوزستان": (6, ["اهواز","دزفول","آبادان"]),
 "البرز": (5, ["کرج","فردیس"]), "مازندران": (5, ["ساری","بابل","آمل"]), "گیلان": (4, ["رشت","انزلی"]),
 "کرمانشاه": (3, ["کرمانشاه"]), "یزد": (3, ["یزد"]), "کرمان": (3, ["کرمان","رفسنجان"]),
 "همدان": (3, ["همدان"]), "قم": (3, ["قم"]), "هرمزگان": (3, ["بندرعباس"]), "اردبیل": (2, ["اردبیل"]),
}
STREETS = ["ولیعصر","بهار","شهید بهشتی","امام خمینی","آزادی","انقلاب","سعدی","فردوسی","مطهری","ملاصدرا","کارگر","گلستان"]
CAT = {  # هم‌خوان با scripts/seed.mjs فروشگاه موبایلر
 "mobile": ("گوشی موبایل", ["اپل","سامسونگ","شیائومی","نوکیا","ناتینگ"], 9e6, 2.2e6, 40),
 "laptop": ("لپ‌تاپ", ["ایسوس","لنوو","اچ‌پی","ایسر","مک‌بوک"], 25e6, 4e6, 20),
 "headphone": ("هدفون", ["سونی","جی‌بی‌ال","ای‌اکس‌ال","انکر","ریزر"], 8e5, 3.5e5, 15),
 "powerbank": ("پاور بانک", ["انکر","شیائومی","باسئوس","انرجایزر","ریمکس"], 6e5, 1.8e5, 10),
 "accessory": ("لوازم جانبی", ["اپل","انکر","باسئوس","یوگرین","سامسونگ"], 2e5, 9e4, 15),
}
cat_names = list(CAT); cat_w = [CAT[c][4] for c in cat_names]

def pick_item(cat=None):
    cat = cat or random.choices(cat_names, cat_w)[0]
    label, brands, base, step, _ = CAT[cat]; i = random.randint(0, 19)
    return {"productSlug": f"{cat}-{i+1}", "category": cat, "name": f"{label} {brands[i%5]} مدل {i+1}",
            "price": int(round((base + step*(i % 7))/1000)*1000), "qty": 1}

prov_names = list(PLACES); prov_w = [PLACES[p][0] for p in prov_names]

def nid(used):
    while True:
        d = [0,0,0] + [random.randint(0,9) for _ in range(6)]   # پیش‌شماره 000 در عمل صادر نمی‌شود
        s = sum(d[i]*(10-i) for i in range(9)) % 11
        v = "".join(map(str, d + [s if s < 2 else 11 - s]))
        if v not in used: used.add(v); return v

def pois(l):
    n, p = 0, math.exp(-l); u = random.random(); c = p
    while u > c: n += 1; p *= l/n; c += p
    return n

def order(k):
    items = [pick_item()]
    if random.random() < 0.25: items.append(pick_item("accessory"))
    total = sum(i["price"]*i["qty"] for i in items)
    down = int(round(total*random.choice([0,0,.1,.2,.3])/1000)*1000)
    n = random.choice([3,6,9,12,18])
    return {"orderId": f"ORD-{k+1:06d}", "items": items, "total": total, "downPayment": down,
            "installments": n, "monthlyInstallment": int(round((total-down)/n/1000)*1000),
            "requestedAt": f"2026-11-{random.randint(1,18):02d}", "status": "pending_credit_check"}

used, used_m, out = set(), set(), []
def mobile():
    while True:
        v = "0900" + "".join(str(random.randint(0,9)) for _ in range(7))
        if v not in used_m: used_m.add(v); return v

for k in range(N):
    r = random.betavariate(2.6, 2.0)            # قابلیت اعتماد پنهان (در خروجی نیست)
    income = int(random.choice([10,12,15,18,22,28,35,50,70,100]) * 1e6 * random.uniform(.8,1.2))
    loans = pois(1.3*(1.5-r)); has_cq = random.random() < 0.55
    bounced = pois(3*(1-r)**2) if has_cq else 0
    overdue = pois(2.6*(1-r)**2)
    prov = random.choices(prov_names, prov_w)[0]; city = random.choice(PLACES[prov][1])
    cq = max(1, min(100, int(100 - bounced*13 - random.randint(0,15) - (1-r)*25))) if has_cq else None
    out.append({
      "nationalId": nid(used), "fullName": f"{random.choice(F)} {random.choice(L)}",
      "mobile": mobile(), "birthYearJalali": random.randint(1350,1385), "employment": random.choice(EMP),
      "province": prov, "city": city,
      "address": f"{city}، خیابان {random.choice(STREETS)}، کوچه {random.randint(1,40)}، پلاک {random.randint(1,120)}",
      "declaredMonthlyIncome": income, "accountAgeMonths": random.randint(6,180),
      "avgAccountBalance6m": int(income * random.uniform(.2,2.5) * (0.4 + r)),
      "recentInquiries6m": pois(0.8 + 5*(1-r)**2),
      "loans": {"activeLoans": loans, "monthlyObligations": int(income*random.uniform(.05,.55)*(0.6 if loans==0 else 1)),
                "overdueInstallments": overdue, "maxDelayDays": 0 if overdue==0 else random.choice([5,12,30,45,90]),
                "everDefaulted": random.random() < (1-r)**2*0.6},
      "cheque": {"hasChequebook": has_cq, "bouncedLast5y": bounced, "chequeScore": cq},
      "blacklisted": bool(r < 0.2 and random.random() < 0.4),
      "order": order(k),
      "synthetic": True})
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1 if N <= 1000 else None, separators=None if N <= 1000 else (",", ":"))
print(f"{len(out)} رکورد → {OUT}")
