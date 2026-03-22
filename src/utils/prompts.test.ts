import { isInteractiveTerminal, formatTemplateForSelection } from './prompts.js';
import type { TemplateInfo } from '../commands/templates.js';

describe('prompts utilities', () => {
  describe('isInteractiveTerminal', () => {
    it('should return false when stdin is not a TTY', () => {
      // In Jest environment, stdin is typically not a TTY
      expect(isInteractiveTerminal()).toBe(false);
    });
  });

  describe('formatTemplateForSelection', () => {
    it('should format template with name, description, and default badge', () => {
      const template: TemplateInfo = {
        id: 'typescript',
        name: 'TypeScript',
        description: 'TypeScript-optimized workflows',
        suitableFor: ['TypeScript projects'],
        isDefault: false,
      };

      const result = formatTemplateForSelection(template);

      expect(result).toContain('TypeScript');
      expect(result).toContain('TypeScript-optimized workflows');
      expect(result).not.toContain('(default)');
    });

    it('should include default badge for default template', () => {
      const template: TemplateInfo = {
        id: 'default',
        name: 'Default',
        description: 'Standard AO workflow',
        suitableFor: ['Any project'],
        isDefault: true,
      };

      const result = formatTemplateForSelection(template);

      expect(result).toContain('Default');
      expect(result).toContain('(default)');
    });
  });
});
