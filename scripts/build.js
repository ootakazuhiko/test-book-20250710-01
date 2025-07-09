const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

class BookBuilder {
  constructor() {
    this.config = JSON.parse(fs.readFileSync('book-config.json', 'utf8'));
    this.outputDir = this.config.output.directory;
  }

  async build() {
    console.log('Building book...');
    
    // Clean output directory
    await fs.emptyDir(this.outputDir);
    
    // Copy static assets
    await this.copyAssets();
    
    // Copy Jekyll config
    await this.copyJekyllConfig();
    
    // Process content
    await this.processContent();
    
    // Generate navigation
    await this.generateNavigation();
    
    console.log('Build complete!');
  }

  async copyAssets() {
    // Copy CSS and JS
    if (await fs.pathExists('docs/assets')) {
      await fs.copy('docs/assets', path.join(this.outputDir, 'assets'));
    }
    
    // Copy layouts and includes
    if (await fs.pathExists('docs/_layouts')) {
      await fs.copy('docs/_layouts', path.join(this.outputDir, '_layouts'));
    }
    if (await fs.pathExists('docs/_includes')) {
      await fs.copy('docs/_includes', path.join(this.outputDir, '_includes'));
    }
  }

  async copyJekyllConfig() {
    // Copy Jekyll files
    await fs.copy('docs/_config.yml', path.join(this.outputDir, '_config.yml'));
    await fs.copy('docs/Gemfile', path.join(this.outputDir, 'Gemfile'));
    await fs.copy('docs/.nojekyll', path.join(this.outputDir, '.nojekyll'));
  }

  async processContent() {
    // Process index
    const indexContent = await fs.readFile('src/index.md', 'utf8');
    await fs.writeFile(path.join(this.outputDir, 'index.md'), indexContent);
    
    // Process chapters, introduction, and appendices
    await this.processDirectory('src/introduction', 'introduction');
    await this.processDirectory('src/chapters', 'chapters');
    await this.processDirectory('src/appendices', 'appendices');
  }

  async processDirectory(srcDir, targetDir) {
    const targetPath = path.join(this.outputDir, targetDir);
    await fs.ensureDir(targetPath);
    
    const items = await fs.readdir(srcDir);
    
    for (const item of items) {
      const srcPath = path.join(srcDir, item);
      const stat = await fs.stat(srcPath);
      
      if (stat.isDirectory()) {
        // Process subdirectory
        const subTargetPath = path.join(targetPath, item);
        await fs.ensureDir(subTargetPath);
        
        const indexPath = path.join(srcPath, 'index.md');
        if (await fs.pathExists(indexPath)) {
          const content = await fs.readFile(indexPath, 'utf8');
          await fs.writeFile(path.join(subTargetPath, 'index.md'), content);
        }
      } else if (item.endsWith('.md')) {
        // Copy markdown file
        const content = await fs.readFile(srcPath, 'utf8');
        await fs.writeFile(path.join(targetPath, item), content);
      }
    }
  }

  async generateNavigation() {
    // Copy existing navigation for now
    await fs.copy('docs/_data', path.join(this.outputDir, '_data'));
  }
}

// Run build
const builder = new BookBuilder();
builder.build().catch(console.error);