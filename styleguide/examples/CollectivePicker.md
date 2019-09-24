```jsx noeditor
// See https://github.com/styleguidist/react-styleguidist/issues/1278
import { randomCollectivesList } from '../mocks/collectives';
```

## Default

```jsx
import { randomCollectivesList } from '../mocks/collectives';
<CollectivePicker collectives={randomCollectivesList} />;
```

# With custom `StyledSelect` options

> Because this component relies on [StyledSelect](#!/StyledSelect), we can pass all the options
> accepted by [react-select](https://react-select.com/props).

### Allow multi

```jsx
import { randomCollectivesList } from '../mocks/collectives';
<CollectivePicker collectives={randomCollectivesList} isMulti />;
```

### Custom placeholder

```jsx
<CollectivePicker placeholder="Pick a collective to destroy" />
```
