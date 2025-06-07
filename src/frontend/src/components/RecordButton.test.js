import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import RecordButton from './RecordButton';

const renderWithProvider = (component) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('RecordButton Component', () => {
  test('renders record button', () => {
    renderWithProvider(<RecordButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('shows M button text', () => {
    renderWithProvider(<RecordButton />);
    
    const buttonText = screen.getByText(/M/i);
    expect(buttonText).toBeInTheDocument();
  });

  test('handles mouse down and up events', () => {
    const mockOnStart = jest.fn();
    const mockOnStop = jest.fn();
    
    renderWithProvider(
      <RecordButton onRecordStart={mockOnStart} onRecordStop={mockOnStop} />
    );
    
    const button = screen.getByRole('button');
    
    fireEvent.mouseDown(button);
    expect(mockOnStart).toHaveBeenCalled();
    
    fireEvent.mouseUp(button);
    expect(mockOnStop).toHaveBeenCalled();
  });
});
