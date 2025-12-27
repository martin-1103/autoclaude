/**
 * Tests for ModelSearchableSelect component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModelSearchableSelect } from './ModelSearchableSelect';
import { useSettingsStore } from '../../stores/settings-store';

// Mock the settings store
vi.mock('../../stores/settings-store');

describe('ModelSearchableSelect', () => {
  const mockDiscoverModels = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the Zustand store - it's a function that accepts a selector
    const mockStore = {
      discoverModels: mockDiscoverModels,
      settings: {} as any,
      isLoading: false,
      error: null,
      profiles: [],
      activeProfileId: null,
      profilesLoading: false,
      profilesError: null,
      isTestingConnection: false,
      testConnectionResult: null,
      modelsLoading: false,
      modelsError: null,
      discoveredModels: new Map(),
      setSettings: vi.fn(),
      updateSettings: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setProfiles: vi.fn(),
      setProfilesLoading: vi.fn(),
      setProfilesError: vi.fn(),
      saveProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteProfile: vi.fn(),
      setActiveProfile: vi.fn(),
      testConnection: vi.fn(),
    };

    // Mock as a selector function
    vi.mocked(useSettingsStore).mockImplementation((selector: any) =>
      selector ? selector(mockStore) : mockStore
    );
  });

  it('should render input with placeholder', () => {
    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
        placeholder="Select a model"
      />
    );

    expect(screen.getByPlaceholderText('Select a model')).toBeInTheDocument();
  });

  it('should render with initial value', () => {
    render(
      <ModelSearchableSelect
        value="claude-3-5-sonnet-20241022"
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByDisplayValue('claude-3-5-sonnet-20241022');
    expect(input).toBeInTheDocument();
  });

  it('should fetch models when dropdown opens', async () => {
    mockDiscoverModels.mockResolvedValue([
      { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude Sonnet 3.5' },
      { id: 'claude-3-5-haiku-20241022', display_name: 'Claude Haiku 3.5' }
    ]);

    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    // Click to open dropdown
    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.focus(input);

    // Wait for models to be fetched and displayed
    await waitFor(() => {
      expect(mockDiscoverModels).toHaveBeenCalledWith(
        'https://api.anthropic.com',
        'sk-test-key-12chars',
        expect.any(AbortSignal)
      );
      // Verify models are displayed
      expect(screen.getByText('Claude Sonnet 3.5')).toBeInTheDocument();
    });
  });

  it('should display loading state while fetching', async () => {
    // Mock a delayed response
    let resolvePromise: (value: ModelInfo[]) => void;
    const promise = new Promise<ModelInfo[]>((resolve) => {
      resolvePromise = resolve;
    });
    mockDiscoverModels.mockReturnValue(promise);

    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.focus(input);

    // Loading spinner should appear in the input (not dropdown text)
    await waitFor(() => {
      // The Loader2 component is rendered (when loading, button is hidden)
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    // Resolve to clean up
    resolvePromise!([{ id: 'test', display_name: 'Test' }]);
  });

  it('should display fetched models in dropdown', async () => {
    mockDiscoverModels.mockResolvedValue([
      { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude Sonnet 3.5' },
      { id: 'claude-3-5-haiku-20241022', display_name: 'Claude Haiku 3.5' }
    ]);

    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Claude Sonnet 3.5')).toBeInTheDocument();
      expect(screen.getByText('claude-3-5-sonnet-20241022')).toBeInTheDocument();
    });
  });

  it('should select model and close dropdown', async () => {
    mockDiscoverModels.mockResolvedValue([
      { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude Sonnet 3.5' }
    ]);

    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.focus(input);

    await waitFor(() => {
      const modelButton = screen.getByText('Claude Sonnet 3.5');
      fireEvent.click(modelButton);
    });

    expect(mockOnChange).toHaveBeenCalledWith('claude-3-5-sonnet-20241022');
  });

  it('should allow manual text input', async () => {
    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.change(input, { target: { value: 'custom-model-name' } });

    expect(mockOnChange).toHaveBeenCalledWith('custom-model-name');
  });

  it('should filter models based on search query', async () => {
    mockDiscoverModels.mockResolvedValue([
      { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude Sonnet 3.5' },
      { id: 'claude-3-5-haiku-20241022', display_name: 'Claude Haiku 3.5' },
      { id: 'claude-3-opus-20240229', display_name: 'Claude Opus 3' }
    ]);

    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.focus(input);

    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText('Claude Sonnet 3.5')).toBeInTheDocument();
    });

    // Type search query
    const searchInput = screen.getByPlaceholderText('Search models...');
    fireEvent.change(searchInput, { target: { value: 'haiku' } });

    // Should only show Haiku
    await waitFor(() => {
      expect(screen.getByText('Claude Haiku 3.5')).toBeInTheDocument();
      expect(screen.queryByText('Claude Sonnet 3.5')).not.toBeInTheDocument();
      expect(screen.queryByText('Claude Opus 3')).not.toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    mockDiscoverModels.mockRejectedValue(
      new Error('This API endpoint does not support model listing')
    );

    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://custom-api.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.focus(input);

    // When discovery fails, component shows info message below input
    await waitFor(() => {
      expect(screen.getByText(/Model discovery not available/)).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter model name (e.g., claude-3-5-sonnet-20241022)');
    });
  });

  it('should show empty state when no models found', async () => {
    mockDiscoverModels.mockResolvedValue([]);

    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.focus(input);

    await waitFor(() => {
      // When no models returned, dropdown closes automatically (line 107-109)
      // User can still type manually
      expect(mockDiscoverModels).toHaveBeenCalled();
    });

    // Dropdown should not be open (closed when empty)
    expect(screen.queryByPlaceholderText('Search models...')).not.toBeInTheDocument();
  });

  it('should show no results message when search does not match', async () => {
    mockDiscoverModels.mockResolvedValue([
      { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude Sonnet 3.5' }
    ]);

    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Claude Sonnet 3.5')).toBeInTheDocument();
    });

    // Search for non-existent model
    const searchInput = screen.getByPlaceholderText('Search models...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No models match your search')).toBeInTheDocument();
    });
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ModelSearchableSelect
        value=""
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
        disabled={true}
      />
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    expect(input).toBeDisabled();
  });

  it('should highlight selected model', async () => {
    mockDiscoverModels.mockResolvedValue([
      { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude Sonnet 3.5' },
      { id: 'claude-3-5-haiku-20241022', display_name: 'Claude Haiku 3.5' }
    ]);

    render(
      <ModelSearchableSelect
        value="claude-3-5-sonnet-20241022"
        onChange={mockOnChange}
        baseUrl="https://api.anthropic.com"
        apiKey="sk-test-key-12chars"
      />
    );

    const input = screen.getByDisplayValue('claude-3-5-sonnet-20241022');
    fireEvent.focus(input);

    await waitFor(() => {
      // Selected model should have Check icon indicator (via background color)
      const sonnetButton = screen.getByText('Claude Sonnet 3.5').closest('button');
      expect(sonnetButton).toHaveClass('bg-accent');
    });
  });

  it('should close dropdown when clicking outside', async () => {
    mockDiscoverModels.mockResolvedValue([
      { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude Sonnet 3.5' }
    ]);

    const { container } = render(
      <div>
        <ModelSearchableSelect
          value=""
          onChange={mockOnChange}
          baseUrl="https://api.anthropic.com"
          apiKey="sk-test-key-12chars"
        />
        <div data-testid="outside-element">Outside</div>
      </div>
    );

    const input = screen.getByPlaceholderText('Select a model or type manually');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Claude Sonnet 3.5')).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside-element'));

    await waitFor(() => {
      expect(screen.queryByText('Claude Sonnet 3.5')).not.toBeInTheDocument();
    });
  });
});
