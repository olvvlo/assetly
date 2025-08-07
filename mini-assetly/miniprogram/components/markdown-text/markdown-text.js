// components/markdown-text/markdown-text.js
Component({
  properties: {
    text: {
      type: String,
      value: ''
    }
  },

  data: {
    parsedContent: []
  },

  observers: {
    'text': function(newText) {
      this.parseMarkdown(newText);
    }
  },

  methods: {
    parseMarkdown: function(text) {
      if (!text) {
        this.setData({ parsedContent: [] });
        return;
      }

      const lines = text.split('\n');
      const parsedContent = [];
      let inTable = false;
      let tableHeaders = [];
      let tableRows = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检查是否是表格行
        if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
          if (!inTable) {
            inTable = true;
            tableHeaders = [];
            tableRows = [];
          }
          
          const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
          
          // 检查是否是分隔行（包含 --- 的行）
          if (cells.every(cell => cell.match(/^-+$/))) {
            continue; // 跳过分隔行
          }
          
          if (tableHeaders.length === 0) {
            tableHeaders = cells;
          } else {
            tableRows.push(cells);
          }
        } else {
          // 如果之前在表格中，现在不是表格行了，结束表格
          if (inTable) {
            parsedContent.push({
              type: 'table',
              headers: tableHeaders,
              rows: tableRows
            });
            inTable = false;
            tableHeaders = [];
            tableRows = [];
          }
          
          if (line.trim() === '') {
            // 空行
            parsedContent.push({
              type: 'break',
              content: ''
            });
          } else if (line.startsWith('# ')) {
            // 一级标题
            parsedContent.push({
              type: 'h1',
              content: this.processInlineStyles(line.substring(2).trim())
            });
          } else if (line.startsWith('## ')) {
            // 二级标题
            parsedContent.push({
              type: 'h2',
              content: this.processInlineStyles(line.substring(3).trim())
            });
          } else if (line.startsWith('### ')) {
            // 三级标题
            parsedContent.push({
              type: 'h3',
              content: this.processInlineStyles(line.substring(4).trim())
            });
          } else if (line.startsWith('#### ')) {
            // 四级标题
            parsedContent.push({
              type: 'h4',
              content: this.processInlineStyles(line.substring(5).trim())
            });
          } else if (line.startsWith('- ') || line.startsWith('• ')) {
            // 无序列表
            parsedContent.push({
              type: 'li',
              content: this.processInlineStyles(line.substring(2).trim())
            });
          } else if (/^\d+\.\s/.test(line)) {
            // 有序列表
            parsedContent.push({
              type: 'ol',
              content: this.processInlineStyles(line.replace(/^\d+\.\s/, '').trim())
            });
          } else if (line.match(/^\*\*.*\*\*$/)) {
            // 整行粗体
            parsedContent.push({
              type: 'bold',
              content: this.processInlineStyles(line.replace(/^\*\*(.*)\*\*$/, '$1').trim())
            });
          } else {
            // 普通段落，处理内联样式
            const processedContent = this.processInlineStyles(line);
            parsedContent.push({
              type: 'p',
              content: processedContent
            });
          }
        }
      }
      
      // 处理最后的表格
      if (inTable && tableHeaders.length > 0) {
        parsedContent.push({
          type: 'table',
          headers: tableHeaders,
          rows: tableRows
        });
      }

      this.setData({ parsedContent });
    },

    processInlineStyles: function(text) {
      if (!text) return '';
      
      // 处理粗体 **text**
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // 处理斜体 *text*
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // 处理行内代码 `code`
      text = text.replace(/`(.*?)`/g, '<code>$1</code>');
      
      return text;
    }
  }
});