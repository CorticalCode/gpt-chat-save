// Run this in browser console on a ChatGPT page with DALL-E images
// to see the image structure

const articles = document.querySelectorAll('article');
console.log('Found', articles.length, 'articles');

articles.forEach((article, i) => {
  const imgs = article.querySelectorAll('img');
  console.log(`\nArticle ${i}: ${imgs.length} images`);
  
  imgs.forEach((img, j) => {
    console.log(`  Image ${j}:`);
    console.log('    src:', img.src?.substring(0, 100));
    console.log('    srcset:', img.srcset?.substring(0, 100));
    console.log('    naturalWidth:', img.naturalWidth);
    console.log('    naturalHeight:', img.naturalHeight);
    console.log('    complete:', img.complete);
    console.log('    classes:', img.className);
    console.log('    parent:', img.parentElement?.tagName, img.parentElement?.className?.substring(0, 50));
    console.log('    grandparent:', img.parentElement?.parentElement?.tagName);
    
    // Check for picture element
    const picture = img.closest('picture');
    if (picture) {
      console.log('    IN PICTURE ELEMENT');
      const sources = picture.querySelectorAll('source');
      sources.forEach(s => console.log('      source:', s.srcset?.substring(0, 80)));
    }
    
    // Check for lazy loading
    console.log('    loading:', img.loading);
    console.log('    data-src:', img.dataset.src?.substring(0, 80));
  });
});
