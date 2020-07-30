import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import useOnClickOutside from '../useClickOutside';

describe('useClickOutside',() => {
  it('should trigger a callback when clicked outside',() => {
    const callback = jest.fn();
    const TestComponent =() => {
      const ref = React.useRef<HTMLDivElement>(null);
      useOnClickOutside(ref, callback)
      return <div ref={ref}>Container</div>
    }
    const {container} =render(<TestComponent></TestComponent>)
    userEvent.click(container)
    expect(callback).toHaveBeenCalledTimes(1);
  })
})