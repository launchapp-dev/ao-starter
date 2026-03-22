import {
  getAvailableTemplates,
  getTemplateById,
  getDetailedTemplate,
  isValidTemplateId,
  TemplatesOptions,
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

  describe('getDetailedTemplate', () => {
    it('should return detailed template info for valid id', () => {
      const template = getDetailedTemplate('typescript');
      expect(template).toBeDefined();
      expect(template?.files).toBeDefined();
      expect(template?.agents).toBeDefined();
      expect(template?.phases).toBeDefined();
      expect(template?.usage).toBeDefined();
      expect(Array.isArray(template?.files)).toBe(true);
      expect(Array.isArray(template?.agents)).toBe(true);
      expect(Array.isArray(template?.phases)).toBe(true);
    });

    it('should include common files in all templates', () => {
      const template = getDetailedTemplate('default');
      expect(template?.files).toContain('agents.yaml');
      expect(template?.files).toContain('phases.yaml');
      expect(template?.files).toContain('workflows.yaml');
      expect(template?.files).toContain('custom.yaml');
    });

    it('should include phases for typescript template', () => {
      const template = getDetailedTemplate('typescript');
      expect(template?.phases).toContain('typecheck');
      expect(template?.phases).toContain('lint');
    });

    it('should include rust-specific phases for rust template', () => {
      const template = getDetailedTemplate('rust');
      expect(template?.phases).toContain('clippy');
      expect(template?.phases).toContain('fmt');
    });

    it('should include benchmark phase for rust template', () => {
      const template = getDetailedTemplate('rust');
      expect(template?.phases).toContain('benchmark');
    });

    it('should include monorepo-specific phases for typescript-monorepo', () => {
      const template = getDetailedTemplate('typescript-monorepo');
      expect(template?.phases).toContain('build');
    });

    it('should return undefined for invalid id', () => {
      const template = getDetailedTemplate('nonexistent');
      expect(template).toBeUndefined();
    });

    it('should generate correct usage command for python template', () => {
      const template = getDetailedTemplate('python');
      expect(template?.usage).toBe('ao init --template python');
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

  describe('TemplatesOptions interface', () => {
    it('should allow options with name', () => {
      const options: TemplatesOptions = { name: 'typescript' };
      expect(options.name).toBe('typescript');
    });

    it('should allow options with json flag', () => {
      const options: TemplatesOptions = { json: true };
      expect(options.json).toBe(true);
    });

    it('should allow empty options', () => {
      const options: TemplatesOptions = {};
      expect(options.name).toBeUndefined();
      expect(options.json).toBeUndefined();
    });
  });
});
