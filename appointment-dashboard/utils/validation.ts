interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateResponse = (data: {
  title: string;
  content: string;
  shortcut?: string;
  category: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.title?.trim()) {
    errors.title = "Title is required";
  }

  if (!data.content?.trim()) {
    errors.content = "Content is required";
  }

  if (!data.category?.trim()) {
    errors.category = "Category is required";
  }

  if (data.shortcut && !/^[a-zA-Z0-9-_]+$/.test(data.shortcut)) {
    errors.shortcut =
      "Shortcut can only contain letters, numbers, hyphens, and underscores";
  }

  if (!data.shortcut || !data.shortcut.trim()) {
    errors.shortcut = "Shortcut is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateCategory = (data: {
  name: string;
  color: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = "Category name is required";
  }

  if (!data.color?.trim()) {
    errors.color = "Color is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
