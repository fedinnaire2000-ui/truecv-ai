# TrueCV AI

موقع MVP لتحسين الـ CV بالذكاء الاصطناعي (بيانات تجريبية/mock حاليا).

## كيفاش تنشرو أونلاين (بلا فلوس)

### 1. ترفعو على GitHub
1. روح لـ https://github.com/new
2. اسم الـ repository: `truecv-ai`
3. خليه Public، **ما تحطش** README (موجود هوني)
4. دوس Create repository
5. في الصفحة اللي تجي بعد، دوس على رابط "uploading an existing file"
6. اسحب (drag & drop) **كل الملفات والمجلدات** اللي فكيت من الـ zip (ما عدا `node_modules` إذا كان موجود)
7. دوس Commit changes

### 2. تربطو بـ Vercel
1. روح لـ https://vercel.com و اعمل Sign up بـ GitHub
2. دوس "Add New… → Project"
3. اختار الـ repository `truecv-ai`
4. Vercel يتعرف على Vite وحدو — ما تبدلش حتى حاجة
5. دوس Deploy
6. بعد دقيقة-دقيقتين، يعطيك رابط نوع `truecv-ai.vercel.app` — هذا موقعك أونلاين!

### 3. تسجلو في Google Search Console
1. روح لـ https://search.google.com/search-console
2. ضيف الرابط متاعك (`https://truecv-ai.vercel.app`)
3. تأكد منه بالطريقة اللي يقترحها (HTML tag عادة أسهل)
4. في "Sitemaps"، ضيف: `sitemap.xml`

### ملاحظة
بدّل `truecv.ai` بالرابط الحقيقي متاعك (`truecv-ai.vercel.app` أو الدومين إذا شريتو) في:
- `index.html` (meta tags)
- `public/robots.txt`
- `public/sitemap.xml`
