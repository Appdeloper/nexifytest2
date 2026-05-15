const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx')) filelist.push(dirFile);
    }
  }
  return filelist;
};

const files = walkSync('./src');
let count = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content.replace(/<img[^>]*logo\.png[^>]*>/g, (match) => {
    let widthMatch = match.match(/width:\s*['"]?(\d+)[pPxX%]*['"]?/);
    let w = widthMatch ? widthMatch[1] : 36;
    if (w === '100') w = "'100%'";
    
    let styleStr = `style={{ width: ${w}, height: ${w}, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }}`;
    
    let res = match;
    if (res.includes('style=')) {
      res = res.replace(/style={{.*?}}/, styleStr);
    } else {
      res = res.replace('/>', ` ${styleStr} />`);
    }
    return res;
  });
  
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    count++;
  }
});
console.log('Files updated:', count);
