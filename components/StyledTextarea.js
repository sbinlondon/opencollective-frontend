import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { space, layout, border, color, typography } from 'styled-system';
import themeGet from '@styled-system/theme-get';

import { overflow, resize } from '../lib/styled_system_custom';
import Container from './Container';
import StyledTag from './StyledTag';

const TextArea = styled.textarea`
  /** Size */
  ${space}
  ${layout}
  ${resize}
  ${overflow}

  /** Borders */
  ${border}

  /** Text */
  ${color}
  ${typography}

  outline: none;

  &:disabled {
    background-color: ${themeGet('colors.black.50')};
    cursor: not-allowed;
  }

  &:focus, &:hover:not(:disabled) {
    border-color: ${themeGet('colors.primary.300')};
  }

  &::placeholder {
    color: ${themeGet('colors.black.400')};
  }
`;

/**
 * A styled textarea that can grows with its content.
 */
export default class StyledTextarea extends React.PureComponent {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    /** If true, the component will update its size based on its content */
    autoSize: PropTypes.bool,
    /** styled-system prop: accepts any css 'border' value */
    border: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** styled-system prop: accepts any css 'border-color' value */
    borderColor: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** styled-system prop: accepts any css 'border-radius' value */
    borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** If not provided, the value will be set to `none` if `autoSize` is true, `vertical` otherwise */
    resize: PropTypes.oneOf(['vertical', 'horizontal', 'both', 'none']),
    /** If true, max text length will be displayed at the bottom right */
    showCount: PropTypes.bool,
    /** @ignore */
    px: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** @ignore */
    py: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  };

  static defaultProps = {
    border: '1px solid',
    borderColor: 'black.300',
    borderRadius: '4px',
    px: 3,
    py: 2,
  };

  constructor(props) {
    super(props);
    this.textareaRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.autoSize) {
      this._adjustHeight(this.textareaRef.current);
    }
  }

  _adjustHeight(target) {
    // Reset height to 0 so component will auto-size
    target.style.height = 0;
    // Use the scroll height to define size
    target.style.height = `${target.scrollHeight}px`;
  }

  render() {
    const { onChange, autoSize, showCount, resize, ...props } = this.props;
    const value = props.value || props.defaultValue || '';

    const textarea = (
      <TextArea
        ref={this.textareaRef}
        as="textarea"
        onChange={e => {
          onChange(e);
          if (this.props.autoSize) {
            this._adjustHeight(e.target);
          }
        }}
        resize={resize || (autoSize ? 'none' : 'vertical')}
        {...props}
      />
    );

    return !showCount ? (
      textarea
    ) : (
      <Container position="relative">
        {textarea}
        <Container position="absolute" bottom="1.25em" right="1.5em">
          <StyledTag>
            <span>{value.length}</span>
            {props.maxLength && <span> / {props.maxLength}</span>}
          </StyledTag>
        </Container>
      </Container>
    );
  }
}
