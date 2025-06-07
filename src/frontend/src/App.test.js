import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store/store';
import App from './App';

// Mock the store for testing
const renderWithProviders = (component) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('App Component', () => {
  test('renders without crashing', () => {
    renderWithProviders(<App />);
  });

  test('renders main navigation elements', () => {
    renderWithProviders(<App />);
    
    // Check if main app structure is rendered
    const appElement = screen.getByTestId('app-container') || document.querySelector('.App');
    expect(appElement).toBeInTheDocument();
  });
});
