#   
## Common UI/UX Issues and Solutions

This is a quick reference for developers to fix common issues found in the MyRoad Project.

---

## 🚨 Critical Fixes

### 1. Replace window.alert() and window.confirm()

**❌ Bad:**
```typescript
if (confirm("Delete this item?")) {
  deleteItem(id);
}
alert("Item deleted!");
```

**✅ Good:**
```typescript
// Use MUI Dialog
<ConfirmDialog
  open={confirmOpen}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
/>

// Use Snackbar for notifications
showSuccess("Item deleted successfully!");
```

---

### 2. Add ARIA Labels to Icon Buttons

**❌ Bad:**
```typescript
<IconButton onClick={handleDelete}>
  <Trash2 size={16} />
</IconButton>
```

**✅ Good:**
```typescript
<IconButton 
  onClick={handleDelete}
  aria-label="Delete document"
>
  <Trash2 size={16} />
</IconButton>
```

---

### 3. Use Theme Colors Instead of Hardcoded Values

**❌ Bad:**
```typescript
<Box sx={{ bgcolor: '#f1f5f9', color: '#64748b' }}>
```

**✅ Good:**
```typescript
<Box sx={{ bgcolor: 'grey.100', color: 'text.secondary' }}>
```

---

### 4. Add Loading States

**❌ Bad:**
```typescript
const [data, setData] = useState([]);

return (
  <div>
    {data.map(item => <Item key={item.id} {...item} />)}
  </div>
);
```

**✅ Good:**
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

if (loading) {
  return <Skeleton variant="rectangular" height={200} />;
}

return (
  <div>
    {data.map(item => <Item key={item.id} {...item} />)}
  </div>
);
```

---

### 5. Add Empty States

**❌ Bad:**
```typescript
return (
  <div>
    {items.map(item => <Item key={item.id} {...item} />)}
  </div>
);
```

**✅ Good:**
```typescript
if (items.length === 0) {
  return (
    <Box textAlign="center" py={8}>
      <FileText size={64} style={{ opacity: 0.2 }} />
      <Typography variant="h6" color="text.secondary" mt={2}>
        No items found
      </Typography>
      <Button variant="contained" startIcon={<Plus />} sx={{ mt: 2 }}>
        Add Item
      </Button>
    </Box>
  );
}

return (
  <div>
    {items.map(item => <Item key={item.id} {...item} />)}
  </div>
);
```

---

## 🎨 Styling Best Practices

### Use Theme Spacing

**❌ Bad:**
```typescript
<Box sx={{ padding: '16px', margin: '24px' }}>
```

**✅ Good:**
```typescript
<Box sx={{ p: 2, m: 3 }}>
// or
<Box sx={{ padding: theme.spacing(2), margin: theme.spacing(3) }}>
```

---

### Consistent Border Radius

**❌ Bad:**
```typescript
<Card sx={{ borderRadius: '8px' }}>
<Paper sx={{ borderRadius: '12px' }}>
```

**✅ Good:**
```typescript
<Card sx={{ borderRadius: 2 }}> // Uses theme.shape.borderRadius * 2
<Paper sx={{ borderRadius: 3 }}>
```

---

### Use Theme Breakpoints

**❌ Bad:**
```typescript
<Box sx={{ 
  '@media (max-width: 768px)': { 
    display: 'none' 
  } 
}}>
```

**✅ Good:**
```typescript
<Box sx={{ 
  display: { xs: 'none', md: 'block' } 
}}>
```

---

## ♿ Accessibility Quick Fixes

### 1. Keyboard Navigation for Custom Interactive Elements

**❌ Bad:**
```typescript
<Paper onClick={handleClick}>
  <Typography>Click me</Typography>
</Paper>
```

**✅ Good:**
```typescript
<Paper
  onClick={handleClick}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  tabIndex={0}
  role="button"
  aria-label="Descriptive label"
  sx={{
    cursor: 'pointer',
    '&:focus': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2
    }
  }}
>
  <Typography>Click me</Typography>
</Paper>
```

---

### 2. Form Field Validation

**❌ Bad:**
```typescript
<TextField
  label="Email"
  value={email}
  onChange={e => setEmail(e.target.value)}
/>
```

**✅ Good:**
```typescript
<TextField
  label="Email"
  type="email"
  required
  value={email}
  onChange={e => setEmail(e.target.value)}
  error={!!emailError}
  helperText={emailError || "We'll never share your email"}
  InputProps={{
    endAdornment: emailValid && (
      <CheckCircle size={20} color="success" />
    )
  }}
/>
```

---

### 3. Loading Button States

**❌ Bad:**
```typescript
<Button onClick={handleSubmit}>
  Submit
</Button>
```

**✅ Good:**
```typescript
<Button 
  onClick={handleSubmit}
  disabled={loading}
  startIcon={loading ? <CircularProgress size={20} /> : <Send />}
>
  {loading ? 'Submitting...' : 'Submit'}
</Button>
```

---

## 📱 Responsive Design

### Responsive Grid

**❌ Bad:**
```typescript
<Grid container>
  <Grid item md={4}>
    <Card>Content</Card>
  </Grid>
</Grid>
```

**✅ Good:**
```typescript
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    <Card>Content</Card>
  </Grid>
</Grid>
```

---

### Responsive Typography

**❌ Bad:**
```typescript
<Typography variant="h3">
  Title
</Typography>
```

**✅ Good:**
```typescript
<Typography 
  variant="h3"
  sx={{
    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
  }}
>
  Title
</Typography>
```

---

### Touch-Friendly Buttons on Mobile

**❌ Bad:**
```typescript
<IconButton size="small">
  <Icon size={16} />
</IconButton>
```

**✅ Good:**
```typescript
<IconButton 
  size={{ xs: 'medium', md: 'small' }}
  sx={{ 
    minWidth: { xs: 44, md: 'auto' },
    minHeight: { xs: 44, md: 'auto' }
  }}
>
  <Icon size={16} />
</IconButton>
```

---

## ⚡ Performance Optimizations

### 1. Memoize Expensive Calculations

**❌ Bad:**
```typescript
const Component = ({ items }) => {
  const filteredItems = items.filter(item => item.active);
  const sortedItems = filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  
  return <List items={sortedItems} />;
};
```

**✅ Good:**
```typescript
const Component = ({ items }) => {
  const sortedItems = useMemo(() => {
    return items
      .filter(item => item.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  
  return <List items={sortedItems} />;
};
```

---

### 2. Memoize Components

**❌ Bad:**
```typescript
const ListItem = ({ item }) => {
  return <div>{item.name}</div>;
};
```

**✅ Good:**
```typescript
const ListItem = React.memo(({ item }) => {
  return <div>{item.name}</div>;
});
```

---

### 3. Avoid Inline Functions in Render

**❌ Bad:**
```typescript
{items.map(item => (
  <Button onClick={() => handleClick(item.id)}>
    {item.name}
  </Button>
))}
```

**✅ Good:**
```typescript
const handleItemClick = useCallback((id) => {
  handleClick(id);
}, [handleClick]);

{items.map(item => (
  <Button onClick={() => handleItemClick(item.id)}>
    {item.name}
  </Button>
))}

// Or even better, create a separate component
const ItemButton = React.memo(({ item, onClick }) => (
  <Button onClick={() => onClick(item.id)}>
    {item.name}
  </Button>
));
```

---

## 🎯 Common Patterns

### Modal/Dialog Pattern

```typescript
const [open, setOpen] = useState(false);
const [data, setData] = useState(null);

const handleOpen = (itemData) => {
  setData(itemData);
  setOpen(true);
};

const handleClose = () => {
  setOpen(false);
  setData(null);
};

return (
  <>
    <Button onClick={() => handleOpen(someData)}>
      Open Dialog
    </Button>
    
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Title
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          aria-label="Close dialog"
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Content */}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  </>
);
```

---

### Search/Filter Pattern

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [filterType, setFilterType] = useState('all');

const filteredItems = useMemo(() => {
  let result = items;
  
  // Apply search
  if (searchQuery) {
    result = result.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply filter
  if (filterType !== 'all') {
    result = result.filter(item => item.type === filterType);
  }
  
  return result;
}, [items, searchQuery, filterType]);

return (
  <Box>
    <Stack direction="row" spacing={2} mb={2}>
      <TextField
        size="small"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: <Search size={20} />
        }}
      />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Filter</InputLabel>
        <Select
          value={filterType}
          label="Filter"
          onChange={(e) => setFilterType(e.target.value)}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="type1">Type 1</MenuItem>
          <MenuItem value="type2">Type 2</MenuItem>
        </Select>
      </FormControl>
    </Stack>
    
    {filteredItems.length === 0 ? (
      <EmptyState />
    ) : (
      <List items={filteredItems} />
    )}
  </Box>
);
```

---

### File Upload Pattern

```typescript
const fileInputRef = useRef<HTMLInputElement>(null);
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
const [uploading, setUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);

const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files) {
    const files = Array.from(event.target.files);
    
    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        showError(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(validFiles);
  }
};

const handleUpload = async () => {
  if (selectedFiles.length === 0) return;
  
  setUploading(true);
  setUploadProgress(0);
  
  try {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }
    
    // Actual upload logic here
    
    showSuccess(`${selectedFiles.length} file(s) uploaded successfully`);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  } catch (error) {
    showError('Upload failed. Please try again.');
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
};

return (
  <Box>
    <input
      ref={fileInputRef}
      type="file"
      multiple
      onChange={handleFileSelect}
      style={{ display: 'none' }}
      accept=".pdf,.doc,.docx,image/*"
    />
    
    <Button
      variant="outlined"
      onClick={() => fileInputRef.current?.click()}
      startIcon={<UploadCloud />}
      disabled={uploading}
    >
      Select Files
    </Button>
    
    {selectedFiles.length > 0 && (
      <Box mt={2}>
        <Typography variant="body2" gutterBottom>
          {selectedFiles.length} file(s) selected
        </Typography>
        <Stack spacing={1}>
          {selectedFiles.map((file, index) => (
            <Chip
              key={index}
              label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
              onDelete={() => {
                setSelectedFiles(files => 
                  files.filter((_, i) => i !== index)
                );
              }}
            />
          ))}
        </Stack>
        
        {uploading && (
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
            />
            <Typography variant="caption" color="text.secondary">
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}
        
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={uploading}
          sx={{ mt: 2 }}
          startIcon={uploading ? <CircularProgress size={20} /> : <Check />}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Box>
    )}
  </Box>
);
```

---

## 🔍 Debugging Tips

### Check Theme Values in DevTools

```typescript
// Add this temporarily to see all theme values
console.log('Theme:', theme);
console.log('Palette:', theme.palette);
console.log('Spacing:', theme.spacing(1)); // 8px by default
```

---

### Test Accessibility

```typescript
// Install React Axe for development
import React from 'react';
import ReactDOM from 'react-dom';

if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

---

### Performance Profiling

```typescript
// Wrap expensive components
import { Profiler } from 'react';

<Profiler
  id="ExpensiveComponent"
  onRender={(id, phase, actualDuration) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  }}
>
  <ExpensiveComponent />
</Profiler>
```

---

## 📚 Additional Resources

- [MUI Documentation](https://mui.com/material-ui/getting-started/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Last Updated:** 2024
**Version:** 1.0
