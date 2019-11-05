import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { Mutation } from 'react-apollo';
import { get, pick } from 'lodash';
import styled from 'styled-components';

import { PencilAlt } from 'styled-icons/fa-solid/PencilAlt';

import StyledButton from './StyledButton';
import Container from './Container';
import MessageBox from './MessageBox';
import StyledTextarea from './StyledTextarea';
import { fadeIn } from './StyledKeyframes';

/** Container used to show the description to users than can edit it */
const EditIcon = styled(PencilAlt)`
  cursor: pointer;
  background-color: white;
  border: 1px solid #aaaeb3;
  border-radius: 25%;
  padding: 15%;
  color: #aaaeb3;

  &:hover {
    color: #8697ad;
  }
`;

/** Component used for cancel / submit buttons */
const FormButton = styled(StyledButton).attrs({
  buttonSize: 'large',
})`
  width: 35%;
  font-weight: normal;
  min-width: 225px;
  text-transform: capitalize;
  margin: 4px 8px;
  animation: ${fadeIn} 0.3s;
`;

/**
 * A field that can be edited inline. Relies directly on GraphQL to handle errors and
 * loading states properly. By default this component will use `TextAreaAutosize`
 * but you can override this behaviour by passing a custom `children` prop.
 */
class InlineEditField extends Component {
  static propTypes = {
    /** Field name */
    field: PropTypes.string.isRequired,
    /** Object that holds the values */
    values: PropTypes.object.isRequired,
    /** The GraphQL mutation used to update this value */
    mutation: PropTypes.object.isRequired,
    /** Can user edit the description */
    canEdit: PropTypes.bool,
    /** Max field length */
    maxLength: PropTypes.number,
    /** Called to format the value before submitting */
    formatBeforeSubmit: PropTypes.func,
    /** Set to false to disable edit icon even if user is allowed to edit */
    showEditIcon: PropTypes.bool,
    /** If given, this function will be used to render the field */
    children: PropTypes.func,
    /**
     * A text that will be rendered if user can edit and there's no value available.
     * Highly recommended if field is nullable.
     */
    placeholder: PropTypes.node,
    /** Editing the top value. */
    topEdit: PropTypes.number,
  };

  static defaultProps = {
    showEditIcon: true,
    topEdit: -5,
  };

  state = { isEditing: false, draft: '' };

  enableEditor = () => {
    this.setState({ isEditing: true, draft: get(this.props.values, this.props.field) });
  };

  disableEditor = () => {
    this.setState({ isEditing: false });
  };

  setDraft = draft => {
    this.setState({ draft });
  };

  renderContent(field, canEdit, value, placeholder, children) {
    if (children) {
      return children({
        value,
        isEditing: false,
        enableEditor: this.enableEditor,
        disableEditor: this.disableEditor,
        setValue: this.setDraft,
      });
    } else if (!value) {
      return canEdit && placeholder ? (
        <StyledButton buttonSize="large" onClick={this.enableEditor} data-cy={`InlineEditField-Add-${field}`}>
          {placeholder}
        </StyledButton>
      ) : null;
    } else {
      return <span>{value}</span>;
    }
  }
  z;
  render() {
    const {
      field,
      values,
      mutation,
      canEdit,
      formatBeforeSubmit,
      showEditIcon,
      placeholder,
      children,
      topEdit,
    } = this.props;
    const { isEditing, draft } = this.state;
    const value = get(values, field);
    const touched = draft !== value;
    if (!isEditing) {
      return (
        <Container position="relative">
          {canEdit && showEditIcon && (
            <Container position="absolute" top={topEdit} right={-5} zIndex={2}>
              <EditIcon size={24} onClick={this.enableEditor} data-cy={`InlineEditField-Trigger-${field}`} />
            </Container>
          )}
          {this.renderContent(field, canEdit, value, placeholder, children)}
        </Container>
      );
    } else {
      return (
        <Mutation mutation={mutation}>
          {(updateField, { loading, error }) => (
            <React.Fragment>
              {children ? (
                children({
                  isEditing: true,
                  value: draft,
                  maxLength: this.props.maxLength,
                  setValue: this.setDraft,
                  enableEditor: this.enableEditor,
                  disableEditor: this.disableEditor,
                })
              ) : (
                <StyledTextarea
                  autoSize
                  autoFocus
                  width={1}
                  value={draft || ''}
                  onChange={e => this.setDraft(e.target.value)}
                  px={0}
                  py={0}
                  border="0"
                  letterSpacing="inherit"
                  fontSize="inherit"
                  fontWeight="inherit"
                  lineHeight="inherit"
                  maxLength={this.props.maxLength}
                  data-cy={`InlineEditField-Textarea-${field}`}
                />
              )}
              <Box width={1}>
                {error && (
                  <MessageBox type="error" my={2} withIcon>
                    {error.message.replace('GraphQL error: ', '')}
                  </MessageBox>
                )}
                <Flex flexWrap="wrap" justifyContent="space-evenly" mt={3}>
                  <FormButton data-cy="InlineEditField-Btn-Cancel" disabled={loading} onClick={this.disableEditor}>
                    <FormattedMessage id="form.cancel" defaultMessage="cancel" />
                  </FormButton>
                  <FormButton
                    buttonStyle="primary"
                    loading={loading}
                    disabled={!touched}
                    data-cy="InlineEditField-Btn-Save"
                    onClick={() => {
                      const variables = pick(values, ['id']);
                      variables[field] = formatBeforeSubmit ? formatBeforeSubmit(draft) : draft;
                      updateField({ variables }).then(this.disableEditor);
                    }}
                  >
                    <FormattedMessage id="save" defaultMessage="Save" />
                  </FormButton>
                </Flex>
              </Box>
            </React.Fragment>
          )}
        </Mutation>
      );
    }
  }
}

export default InlineEditField;
