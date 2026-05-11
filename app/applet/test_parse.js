const cheerio = require('cheerio');
const fs = require('fs');

function parseContent(filePath, content) {
    if (filePath.endsWith('.htm') || filePath.endsWith('.html')) {
        const $ = cheerio.load(content);
        
        $('.footnote, .footnotes, .hashiya, .hasheya, .margnote, .notes, .commentary').remove();
        
        $('div.PageText').each(function() {
            let foundHr = false;
            $(this).contents().each(function() {
                if (foundHr) {
                    $(this).remove();
                } else if ((this.tagName === 'hr' || this.tagName === 'HR' || this.name === 'hr') && $(this).attr('width') == '95') {
                    foundHr = true;
                    $(this).remove();
                }
            });
        });
        
        $('.PageHead').remove();

        let finalBlocks = [];
        let isSkipping = false;
        
        $('.PageText').each(function(index) {
            if (index === 0) return;

            let titles = [];
            $(this).find('.title, [data-type="title"]').each(function() {
                titles.push($(this).text().trim());
            });
            
            let isMuhaqqiqOrIndex = false;
            for (let t of titles) {
                t = t.replace(/[^ \u0600-\u06FF]/g, '').trim();
                const skipKeywords = ['مقدمة التحقيق', 'مقدمة المحقق', 'عملي في', 'ترجمة', 'فهرس', 'تقديم', 'المراجع', 'المصادر', 'فهارس', 'وصف المخطوط', 'الرموز'];
                for (const kw of skipKeywords) {
                    if (t.startsWith(kw) || t.includes('فهرس') || t.includes('المراجع') || t.includes('المصادر')) {
                        isMuhaqqiqOrIndex = true;
                        break;
                    }
                }
            }
            console.log("Titles for block " + index + ":", titles, " => Muhaqqiq/Index:", isMuhaqqiqOrIndex);
            
            for (let t of titles) {
                t = t.replace(/[^ \u0600-\u06FF]/g, '').trim();
                if (t.match(/^(مقدمة المؤلف|كتاب|باب|فصل|القول)/)) {
                    isSkipping = false;
                    console.log("Unskipping due to title:", t);
                }
            }

            if (isMuhaqqiqOrIndex) {
                isSkipping = true;
            } else if (titles.length > 0 && isSkipping) {
                // if it's skipping and it has titles, do we keep skipping? Yes, unless it's unskipped above.
            } else if (titles.length > 0) {
                isSkipping = false;
            }
            
            let cleanText = $(this).text().replace(/[\u064B-\u065F]/g, '').trim();
            if (cleanText.match(/^(?:بسم لله|بسم الله|الحمد لله|قال المؤلف|أما بعد|أصول|حدثنا|أخبرنا|أخبرني|حدثني)/)) {
                console.log("Unskipping due to text match:", cleanText.substring(0, 30));
                isSkipping = false;
            }
            
            console.log("Block " + index + " isSkipping=", isSkipping);
            
            if (!isSkipping) {
                let text = $(this).text();
                text = text.replace(/\[\d+\]/g, ''); 
                text = text.replace(/\(\d+\)/g, ''); 
                text = text.replace(/^([\s]*\d+[\s]*[)\]])/gm, '');
                text = text.replace(/^[\s]*=.*/gm, '');
                text = text.replace(/\s+/g, ' ').trim();
                if (text.length > 0) {
                    finalBlocks.push(text);
                }
            }
        });
        
        return finalBlocks.join('\n\n');
    }
    return content;
}

const content = fs.readFileSync('books/aqeedah/dummy.htm', 'utf8');
const result = parseContent('books/aqeedah/dummy.htm', content);
console.log(result.substring(0, 500));
