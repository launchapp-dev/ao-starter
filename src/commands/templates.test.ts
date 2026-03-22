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

    it('should include bun, deno, elixir, and go templates', () => {
      const templates = getAvailableTemplates();
      const templateIds = templates.map((t) => t.id);

      expect(templateIds).toContain('bun');
      expect(templateIds).toContain('deno');
      expect(templateIds).toContain('elixir');
      expect(templateIds).toContain('go');
    });

    it('should have correct metadata for bun template', () => {
      const template = getTemplateById('bun');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Bun');
      expect(template?.description).toContain('Bun');
      expect(template?.isDefault).toBe(false);
      expect(Array.isArray(template?.suitableFor)).toBe(true);
      expect(template?.suitableFor.length).toBeGreaterThan(0);
    });

    it('should have correct metadata for deno template', () => {
      const template = getTemplateById('deno');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Deno');
      expect(template?.description).toContain('Deno');
      expect(template?.isDefault).toBe(false);
      expect(Array.isArray(template?.suitableFor)).toBe(true);
      expect(template?.suitableFor.length).toBeGreaterThan(0);
    });

    it('should have correct metadata for elixir template', () => {
      const template = getTemplateById('elixir');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Elixir');
      expect(template?.description).toContain('Elixir');
      expect(template?.isDefault).toBe(false);
      expect(Array.isArray(template?.suitableFor)).toBe(true);
      expect(template?.suitableFor.length).toBeGreaterThan(0);
    });

    it('should have correct metadata for go template', () => {
      const template = getTemplateById('go');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Go');
      expect(template?.description).toContain('Go');
      expect(template?.isDefault).toBe(false);
      expect(Array.isArray(template?.suitableFor)).toBe(true);
      expect(template?.suitableFor.length).toBeGreaterThan(0);
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

    it('should find bun template', () => {
      const template = getTemplateById('bun');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Bun');
    });

    it('should find deno template', () => {
      const template = getTemplateById('deno');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Deno');
    });

    it('should find go template', () => {
      const template = getTemplateById('go');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Go');
    });

    it('should find elixir template', () => {
      const template = getTemplateById('elixir');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Elixir');
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
      expect(isValidTemplateId('bun')).toBe(true);
      expect(isValidTemplateId('deno')).toBe(true);
      expect(isValidTemplateId('go')).toBe(true);
      expect(isValidTemplateId('elixir')).toBe(true);
    });

    it('should return false for invalid template ids', () => {
      expect(isValidTemplateId('nonexistent')).toBe(false);
      expect(isValidTemplateId('')).toBe(false);
      expect(isValidTemplateId('TYPESCRIPT')).toBe(false);
      expect(isValidTemplateId('next-js')).toBe(false);
    });
  });
});
