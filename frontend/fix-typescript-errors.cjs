#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.git') {
      files.push(...findTsFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix common TypeScript issues
function fixTypeScriptFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Remove unused React imports when jsx: react-jsx is used
  if (content.includes("import React from 'react';") && 
      !content.includes('React.') && 
      !content.includes('<React.')) {
    content = content.replace(/import React from 'react';\n?/, '');
    modified = true;
  }

  // Fix type-only imports - add 'type' keyword for interface/type imports
  const typeOnlyImports = [
    'BacktestResult', 'BacktestParameters', 'DailyPnL', 'CurrencyPair', 'TORBSettings',
    'TORBSignal', 'TORBRange', 'PatternMatch', 'PatternAnalysis', 'AppSettings',
    'OHLCData', 'TradingMode'
  ];

  typeOnlyImports.forEach(typeName => {
    // Match imports like: import { TypeName } from '...'
    const importRegex = new RegExp(`import\\s*{([^}]*\\b${typeName}\\b[^}]*)}\\s*from`, 'g');
    content = content.replace(importRegex, (match, imports) => {
      if (!imports.includes('type ')) {
        // Add 'type' keyword to the specific import
        const updatedImports = imports.replace(new RegExp(`\\b${typeName}\\b`), `type ${typeName}`);
        modified = true;
        return match.replace(imports, updatedImports);
      }
      return match;
    });
  });

  // Remove unused imports (common ones)
  const unusedImports = [
    'Statistic', 'Button', 'Header', 'Title', 'OHLCData'
  ];

  unusedImports.forEach(importName => {
    if (content.includes(`${importName}`) && !new RegExp(`<${importName}|${importName}\\.`, 'g').test(content)) {
      content = content.replace(new RegExp(`,\\s*${importName}`, 'g'), '');
      content = content.replace(new RegExp(`${importName},\\s*`, 'g'), '');
      content = content.replace(new RegExp(`{\\s*${importName}\\s*}`, 'g'), '{}');
      modified = true;
    }
  });

  // Clean up empty import statements
  content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];\n?/g, '');

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }

  return modified;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files`);

let totalFixed = 0;
tsFiles.forEach(file => {
  if (fixTypeScriptFile(file)) {
    totalFixed++;
  }
});

console.log(`Fixed ${totalFixed} files`);