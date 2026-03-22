import {
  getAvailableTemplates,
  getTemplateById,
  isValidTemplateId,
} from './templates.js';

describe('templates', () => {
  describe('getAvailableTemplates', () => {
    it('should return all available templates', () => {
      const templates = getAvailableTemplates();
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should include a default template', () => {
      const templates = getAvailableTemplates();
      const defaultTemplate = templates.find((t) => t.isDefault);
      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate?.id).toBe('default');
    });

    it('should have required fields for each template', () => {
      const templates = getAvailableTemplates();
      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('suitableFor');
        expect(template).toHaveProperty('isDefault');
        expect(Array.isArray(template.suitableFor)).toBe(true);
      });
    });
  });

  describe('getTemplateById', () => {
    it('should return template for valid id', () => {
      const template = getTemplateById('typescript');
      expect(template).toBeDefined();
      expect(template?.id).toBe('typescript');
      expect(template?.name).toBe('TypeScript');
    });

    it('should return undefined for invalid id', () => {
      const template = getTemplateById('nonexistent');
      expect(template).toBeUndefined();
    });

    it('should find the default template', () => {
      const template = getTemplateById('default');
      expect(template).toBeDefined();
      expect(template?.isDefault).toBe(true);
    });

    it('should find rust-workspace template', () => {
      const template = getTemplateById('rust-workspace');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Rust Workspace');
    });
  });

  describe('isValidTemplateId', () => {
    it('should return true for valid template ids', () => {
      expect(isValidTemplateId('default')).toBe(true);
      expect(isValidTemplateId('typescript')).toBe(true);
      expect(isValidTemplateId('nextjs')).toBe(true);
      expect(isValidTemplateId('rust')).toBe(true);
      expect(isValidTemplateId('rust-workspace')).toBe(true);
      expect(isValidTemplateId('python')).toBe(true);
      expect(isValidTemplateId('javascript')).toBe(true);
      expect(isValidTemplateId('typescript-monorepo')).toBe(true);
    });

    it('should return false for invalid template ids', () => {
      expect(isValidTemplateId('nonexistent')).toBe(false);
      expect(isValidTemplateId('')).toBe(false);
      expect(isValidTemplateId('TYPESCRIPT')).toBe(false);
      expect(isValidTemplateId('next-js')).toBe(false);
    });
  });
});
