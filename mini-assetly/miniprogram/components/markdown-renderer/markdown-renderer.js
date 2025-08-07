// components/markdown-renderer/markdown-renderer.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    content: {
      type: String,
      value: '',
      observer: function(newVal) {
        this.parseMarkdown(newVal);
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    parsedContent: []
  },

  /**
   * 组件的方法列表
   */
  methods: {
    parseMarkdown: function(content) {
      if (!content) {
        this.setData({ parsedContent: [] });
        return;
      }

      const lines = content.split('\n');
      const parsedContent = [];
      let inTable = false;
      let tableHeaders = [];
      let tableRows = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line.trim()) {
          // 如果在表格中遇到空行，结束表格
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
          
          // 空行
          parsedContent.push({
            type: 'br',
            content: ''
          });
          continue;
        }
        
        // 表格解析
        if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
          
          if (!inTable) {
            // 开始新表格
            inTable = true;
            tableHeaders = cells;
          } else if (cells.every(cell => cell.match(/^:?-+:?$/))) {
            // 表格分隔行，跳过
            continue;
          } else {
            // 表格数据行
            tableRows.push(cells);
          }
          continue;
        } else if (inTable) {
          // 结束表格
          parsedContent.push({
            type: 'table',
            headers: tableHeaders,
            rows: tableRows
          });
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        
        // 标题解析
        if (line.startsWith('##### ')) {
          const content = line.substring(6).trim();
          // 检查标题内容是否包含粗体
          if (content.includes('**')) {
            const parts = this.parseBoldText(content);
            if (parts.length > 0) {
              parsedContent.push({
                type: 'h5-mixed',
                parts: parts
              });
            } else {
              parsedContent.push({
                type: 'h5',
                content: content
              });
            }
          } else {
            parsedContent.push({
              type: 'h5',
              content: content
            });
          }
        } else if (line.startsWith('#### ')) {
          const content = line.substring(5).trim();
          // 检查标题内容是否包含粗体
          if (content.includes('**')) {
            const parts = this.parseBoldText(content);
            if (parts.length > 0) {
              parsedContent.push({
                type: 'h4-mixed',
                parts: parts
              });
            } else {
              parsedContent.push({
                type: 'h4',
                content: content
              });
            }
          } else {
            parsedContent.push({
              type: 'h4',
              content: content
            });
          }
        } else if (line.startsWith('### ')) {
          const content = line.substring(4).trim();
          // 检查标题内容是否包含粗体
          if (content.includes('**')) {
            const parts = this.parseBoldText(content);
            if (parts.length > 0) {
              parsedContent.push({
                type: 'h3-mixed',
                parts: parts
              });
            } else {
              parsedContent.push({
                type: 'h3',
                content: content
              });
            }
          } else {
            parsedContent.push({
              type: 'h3',
              content: content
            });
          }
        } else if (line.startsWith('## ')) {
          const content = line.substring(3).trim();
          // 检查标题内容是否包含粗体
          if (content.includes('**')) {
            const parts = this.parseBoldText(content);
            if (parts.length > 0) {
              parsedContent.push({
                type: 'h2-mixed',
                parts: parts
              });
            } else {
              parsedContent.push({
                type: 'h2',
                content: content
              });
            }
          } else {
            parsedContent.push({
              type: 'h2',
              content: content
            });
          }
        } else if (line.startsWith('# ')) {
          const content = line.substring(2).trim();
          // 检查标题内容是否包含粗体
          if (content.includes('**')) {
            const parts = this.parseBoldText(content);
            if (parts.length > 0) {
              parsedContent.push({
                type: 'h1-mixed',
                parts: parts
              });
            } else {
              parsedContent.push({
                type: 'h1',
                content: content
              });
            }
          } else {
            parsedContent.push({
              type: 'h1',
              content: content
            });
          }
        }
        // 分隔线解析
        else if (line.trim() === '---' || line.trim() === '___' || line.trim().match(/^-{3,}$/)) {
          parsedContent.push({
            type: 'hr',
            content: ''
          });
        }
        // 列表项解析（无序列表）
        else if (line.startsWith('- ') || line.startsWith('• ')) {
          const content = line.substring(2).trim();
          // 检查列表项内容是否包含粗体
          if (content.includes('**')) {
            const parts = this.parseBoldText(content);
            if (parts.length > 0) {
              parsedContent.push({
                type: 'li-mixed',
                parts: parts
              });
            } else {
              parsedContent.push({
                type: 'li',
                content: content
              });
            }
          } else {
            parsedContent.push({
              type: 'li',
              content: content
            });
          }
        }
        // 有序列表项解析
        else if (line.match(/^\s*\d+\.\s/)) {
          const content = line.replace(/^\s*\d+\.\s/, '').trim();
          // 检查列表项内容是否包含粗体
          if (content.includes('**')) {
            const parts = this.parseBoldText(content);
            if (parts.length > 0) {
              parsedContent.push({
                type: 'ol-mixed',
                parts: parts,
                number: line.match(/^\s*(\d+)\./)[1]
              });
            } else {
              parsedContent.push({
                type: 'ol',
                content: content,
                number: line.match(/^\s*(\d+)\./)[1]
              });
            }
          } else {
            parsedContent.push({
              type: 'ol',
              content: content,
              number: line.match(/^\s*(\d+)\./)[1]
            });
          }
        }
        // 粗体文本解析
        else if (line.includes('**')) {
          const parts = this.parseBoldText(line);
          // 只有当解析出有效内容时才添加mixed类型
          if (parts.length > 0) {
            parsedContent.push({
              type: 'mixed',
              parts: parts
            });
          } else {
            // 如果没有有效的粗体内容，作为普通段落处理
            parsedContent.push({
              type: 'p',
              content: line.trim()
            });
          }
        }
        // 普通段落
        else {
          parsedContent.push({
            type: 'p',
            content: line.trim()
          });
        }
      }
      
      // 如果最后还在表格中，添加表格
      if (inTable) {
        parsedContent.push({
          type: 'table',
          headers: tableHeaders,
          rows: tableRows
        });
      }
      
      this.setData({ parsedContent });
    },

    // 解析粗体文本
    parseBoldText: function(text) {
      const parts = [];
      const regex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        // 添加粗体前的普通文本
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: text.substring(lastIndex, match.index)
          });
        }
        
        // 只有当粗体内容不为空时才添加
        if (match[1] && match[1].trim()) {
          parts.push({
            type: 'bold',
            content: match[1]
          });
        }
        
        lastIndex = regex.lastIndex;
      }
      
      // 添加剩余的普通文本
      if (lastIndex < text.length) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex)
        });
      }
      
      // 如果没有找到任何粗体标记，但文本包含**，说明可能是未配对的符号
      if (parts.length === 0 && text.includes('**')) {
        parts.push({
          type: 'text',
          content: text
        });
      }
      
      return parts;
    }
  }
});