import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../shared/api.js';
import { DEFAULT_SCHEMA_DEFINITIONS, mergeSchemaDefinitions } from '../../shared/constants.js';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit2, Trash2, Eye, EyeOff, Plus, Save, Loader2, MoreHorizontal } from "lucide-react";

export default function ProfilePage() {
  const [schemaDefinitions, setSchemaDefinitions] = useState([]);
  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFields, setSavedFields] = useState(new Set());
  const [error, setError] = useState('');
  
  const [expandedSection, setExpandedSection] = useState('personal_info');
  const [showSensitive, setShowSensitive] = useState({});
  
  // Field Dialogs
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null); // null means adding new
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [fieldForm, setFieldForm] = useState({ label: '', type: 'text', sensitive: false });

  // Category Dialogs
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ title: '', isArray: false, icon: '✨' });

  // Delete Confirmations
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'field' | 'category', sectionId, fieldKey? }

  useEffect(() => {
    getProfile()
      .then(res => {
        let profile = res.profile || {};
        let schemas = profile.schemaDefinitions || [];
        let data = profile.profileData || {};
        schemas = mergeSchemaDefinitions(schemas);
        setSchemaDefinitions(schemas);
        setProfileData(data);
        if (schemas.length > 0 && !expandedSection) {
          setExpandedSection(schemas[0].id);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { schemaDefinitions, profileData };
      const res = await updateProfile(payload);
      
      const newSchemas = res.profile?.schemaDefinitions || schemaDefinitions;
      const newData = res.profile?.profileData || profileData;
      setSchemaDefinitions(newSchemas);
      setProfileData(newData);
      
      setSavedFields(new Set(['all']));
      setTimeout(() => setSavedFields(new Set()), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (sectionId, fieldKey, value) => {
    setProfileData(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldKey]: value
      }
    }));
  };

  const handleArrayFieldChange = (sectionId, index, fieldKey, value) => {
    setProfileData(prev => {
      const sectionArray = [...(prev[sectionId] || [])];
      sectionArray[index] = { ...sectionArray[index], [fieldKey]: value };
      return { ...prev, [sectionId]: sectionArray };
    });
  };

  const handleAddArrayItem = (sectionId) => {
    setProfileData(prev => {
      const sectionArray = [...(prev[sectionId] || [])];
      sectionArray.push({});
      return { ...prev, [sectionId]: sectionArray };
    });
  };

  const handleRemoveArrayItem = (sectionId, index) => {
    setProfileData(prev => {
      const sectionArray = [...(prev[sectionId] || [])];
      sectionArray.splice(index, 1);
      return { ...prev, [sectionId]: sectionArray };
    });
  };

  const openAddField = (sectionId) => {
    setCurrentSectionId(sectionId);
    setEditingField(null);
    setFieldForm({ label: '', type: 'text', sensitive: false });
    setIsFieldDialogOpen(true);
  };

  const openEditField = (sectionId, fieldDef) => {
    setCurrentSectionId(sectionId);
    setEditingField(fieldDef);
    setFieldForm({ label: fieldDef.label, type: fieldDef.type, sensitive: fieldDef.sensitive });
    setIsFieldDialogOpen(true);
  };

  const saveField = () => {
    if (!fieldForm.label.trim()) return alert("Label is required");
    
    setSchemaDefinitions(prev => prev.map(sec => {
      if (sec.id === currentSectionId) {
        let newFields = [...(sec.fields || [])];
        if (editingField) {
           const idx = newFields.findIndex(f => f.key === editingField.key);
           if (idx !== -1) {
             const oldKey = editingField.key;
             const newKey = fieldForm.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
             newFields[idx] = { key: newKey, label: fieldForm.label, type: fieldForm.type, sensitive: fieldForm.sensitive };
             
             if (oldKey !== newKey && profileData[currentSectionId]) {
               setProfileData(pData => {
                 let newData = { ...pData };
                 if (sec.isArray) {
                    newData[currentSectionId] = newData[currentSectionId].map(item => {
                       const { [oldKey]: oldVal, ...rest } = item;
                       return { ...rest, [newKey]: oldVal };
                    });
                 } else {
                    const { [oldKey]: oldVal, ...rest } = newData[currentSectionId];
                    newData[currentSectionId] = { ...rest, [newKey]: oldVal };
                 }
                 return newData;
               });
             }
           }
        } else {
           const key = fieldForm.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
           newFields.push({ key, label: fieldForm.label, type: fieldForm.type, sensitive: fieldForm.sensitive });
        }
        return { ...sec, fields: newFields };
      }
      return sec;
    }));
    
    setIsFieldDialogOpen(false);
  };

  const confirmDeleteField = () => {
    if (!itemToDelete || itemToDelete.type !== 'field') return;
    const { sectionId, fieldKey } = itemToDelete;
    
    setSchemaDefinitions(prev => prev.map(sec => {
      if (sec.id === sectionId) {
         return { ...sec, fields: sec.fields.filter(f => f.key !== fieldKey) };
      }
      return sec;
    }));
    
    // Cleanup data
    setProfileData(pData => {
       let newData = { ...pData };
       const sec = schemaDefinitions.find(s => s.id === sectionId);
       if (sec && newData[sectionId]) {
         if (sec.isArray) {
            newData[sectionId] = newData[sectionId].map(item => {
              const { [fieldKey]: removed, ...rest } = item;
              return rest;
            });
         } else {
            const { [fieldKey]: removed, ...rest } = newData[sectionId];
            newData[sectionId] = rest;
         }
       }
       return newData;
    });
    
    setItemToDelete(null);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ title: '', isArray: false, icon: '✨' });
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (section) => {
    setEditingCategory(section);
    setCategoryForm({ title: section.title, isArray: section.isArray, icon: section.icon || '✨' });
    setIsCategoryDialogOpen(true);
  };

  const saveCategory = () => {
    if (!categoryForm.title.trim()) return alert("Title is required");
    
    setSchemaDefinitions(prev => {
      if (editingCategory) {
        return prev.map(sec => {
          if (sec.id === editingCategory.id) {
             return { ...sec, title: categoryForm.title, icon: categoryForm.icon, isArray: categoryForm.isArray };
          }
          return sec;
        });
      } else {
        const id = categoryForm.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        setExpandedSection(id);
        return [...prev, { id, title: categoryForm.title, icon: categoryForm.icon, isArray: categoryForm.isArray, fields: [] }];
      }
    });
    setIsCategoryDialogOpen(false);
  };

  const confirmDeleteCategory = () => {
    if (!itemToDelete || itemToDelete.type !== 'category') return;
    const { sectionId } = itemToDelete;
    setSchemaDefinitions(prev => prev.filter(s => s.id !== sectionId));
    setProfileData(pData => {
       const { [sectionId]: removed, ...rest } = pData;
       return rest;
    });
    setItemToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">Your Profile</h2>
        <p className="text-muted-foreground">Manage your information used for autofilling forms.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <Accordion type="single" collapsible value={expandedSection} onValueChange={setExpandedSection} className="space-y-4">
        {schemaDefinitions.map(section => (
          <AccordionItem key={section.id} value={section.id} className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
             <AccordionTrigger className="hover:no-underline py-4 px-5 hover:bg-muted/50 transition-colors">
               <div className="flex items-center gap-3">
                 <span className="text-xl bg-background p-1.5 rounded-lg shadow-sm border border-border">{section.icon}</span>
                 <span className="font-semibold text-card-foreground text-lg">{section.title}</span>
                 {section.isArray && (
                   <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">List</span>
                 )}
               </div>
             </AccordionTrigger>
            
            <AccordionContent className="px-5 pb-5 pt-2">
              {!section.isArray ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {(section.fields || []).map(fieldDef => {
                      const isSensitive = fieldDef.sensitive;
                      const showValue = showSensitive[`${section.id}_${fieldDef.key}`];
                      const val = profileData[section.id]?.[fieldDef.key] || '';

                      return (
                        <div key={fieldDef.key} className={`${fieldDef.type === 'textarea' ? 'md:col-span-2' : ''} space-y-2`}>
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 text-muted-foreground">
                               {fieldDef.label}
                               {isSensitive && <span title="Encrypted">🔒</span>}
                            </Label>
                            <div className="flex items-center gap-1">
                               {isSensitive && (
                                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setShowSensitive(s => ({ ...s, [`${section.id}_${fieldDef.key}`]: !s[`${section.id}_${fieldDef.key}`] }))}>
                                    {showValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                 </Button>
                               )}
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                     <MoreHorizontal className="w-4 h-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => openEditField(section.id, fieldDef)}>
                                     <Edit2 className="w-4 h-4 mr-2" /> Edit Field
                                   </DropdownMenuItem>
                                   <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setItemToDelete({ type: 'field', sectionId: section.id, fieldKey: fieldDef.key })}>
                                     <Trash2 className="w-4 h-4 mr-2" /> Delete Field
                                   </DropdownMenuItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                            </div>
                          </div>
                          
                          {fieldDef.type === 'textarea' ? (
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                              rows={3}
                              value={val}
                              onChange={e => handleFieldChange(section.id, fieldDef.key, e.target.value)}
                            />
                          ) : fieldDef.type === 'select' ? (
                            <Select value={val} onValueChange={(v) => handleFieldChange(section.id, fieldDef.key, v)}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Select..." />
                               </SelectTrigger>
                               <SelectContent>
                                  {fieldDef.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                               </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={isSensitive && !showValue ? 'password' : fieldDef.type}
                              value={val}
                              onChange={e => handleFieldChange(section.id, fieldDef.key, e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="pt-4 border-t border-border mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Button variant="outline" size="sm" onClick={() => openAddField(section.id)} className="w-full sm:w-auto text-primary border-primary/20 bg-primary/5 hover:bg-primary/10">
                       <Plus className="w-4 h-4 mr-2" /> Add Field
                    </Button>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button variant="secondary" size="sm" onClick={() => openEditCategory(section)} className="flex-1 sm:flex-none">
                         Edit Category
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ type: 'category', sectionId: section.id })} className="flex-1 sm:flex-none">
                         Delete Category
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {(profileData[section.id] || []).map((item, index) => (
                    <Card key={index} className="relative overflow-visible border-dashed">
                      <div className="absolute -top-3 -right-3">
                        <Button variant="destructive" size="icon" className="w-7 h-7 rounded-full shadow-md" onClick={() => handleRemoveArrayItem(section.id, index)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <CardContent className="pt-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {(section.fields || []).map(fieldDef => {
                            const val = item[fieldDef.key] || '';
                            return (
                              <div key={fieldDef.key} className={`${fieldDef.type === 'textarea' ? 'md:col-span-2' : ''} space-y-2`}>
                                <div className="flex items-center justify-between">
                                  <Label className="text-muted-foreground">{fieldDef.label} {fieldDef.sensitive && '🔒'}</Label>
                                  <div className="flex items-center gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                     <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                         <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground">
                                           <MoreHorizontal className="w-3 h-3" />
                                         </Button>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end">
                                         <DropdownMenuItem onClick={() => openEditField(section.id, fieldDef)}>
                                            <Edit2 className="w-4 h-4 mr-2" /> Edit Field
                                         </DropdownMenuItem>
                                         <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setItemToDelete({ type: 'field', sectionId: section.id, fieldKey: fieldDef.key })}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Field
                                         </DropdownMenuItem>
                                       </DropdownMenuContent>
                                     </DropdownMenu>
                                  </div>
                                </div>
                                {fieldDef.type === 'textarea' ? (
                                  <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y" rows={2} value={val} onChange={e => handleArrayFieldChange(section.id, index, fieldDef.key, e.target.value)} />
                                ) : fieldDef.type === 'select' ? (
                                   <Select value={val} onValueChange={(v) => handleArrayFieldChange(section.id, index, fieldDef.key, v)}>
                                     <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                     <SelectContent>{fieldDef.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                   </Select>
                                ) : (
                                  <Input type={fieldDef.sensitive ? 'password' : fieldDef.type} value={val} onChange={e => handleArrayFieldChange(section.id, index, fieldDef.key, e.target.value)} />
                                )}
                              </div>
                            );
                          })}
                         </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-2">
                     <Button variant="outline" className="flex-1 border-dashed border-2 py-6 text-muted-foreground hover:text-foreground" onClick={() => handleAddArrayItem(section.id)}>
                       <Plus className="w-4 h-4 mr-2" /> Add {section.title.split(' ')[0]} Entry
                     </Button>
                     <Button variant="secondary" onClick={() => openAddField(section.id)} className="py-6 whitespace-nowrap">
                       <Plus className="w-4 h-4 mr-2" /> Add Field to Schema
                     </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4 justify-end">
                    <Button variant="secondary" size="sm" onClick={() => openEditCategory(section)}>
                       Edit Category
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ type: 'category', sectionId: section.id })}>
                       Delete Category
                    </Button>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8">
        <Button variant="outline" onClick={openAddCategory} className="w-full border-dashed border-2 py-8 text-muted-foreground hover:text-foreground text-lg">
          <Plus className="w-5 h-5 mr-2" /> Add New Category
        </Button>
      </div>

      {/* Save Footer */}
      <div className="sticky bottom-0 left-0 right-0 p-3 bg-background/90 backdrop-blur-md border-t border-border flex justify-end items-center gap-4 z-10 mt-8 rounded-t-xl -mx-6 -mb-6 px-6 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
        {savedFields.has('all') && <span className="text-primary text-sm font-medium animate-pulse">✓ Saved Successfully</span>}
        <Button onClick={handleSave} disabled={saving} className="shadow-sm shadow-primary/20 min-w-[140px]">
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Profile</>
          )}
        </Button>
      </div>

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
            <DialogDescription>Define the field properties below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Field Label</Label>
              <Input value={fieldForm.label} onChange={e => setFieldForm({...fieldForm, label: e.target.value})} placeholder="e.g. Job Title" />
            </div>
            <div className="space-y-2">
              <Label>Input Type</Label>
              <Select value={fieldForm.type} onValueChange={v => setFieldForm({...fieldForm, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="textarea">Long Text (Textarea)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
               <input type="checkbox" id="sensitive-chk" checked={fieldForm.sensitive} onChange={e => setFieldForm({...fieldForm, sensitive: e.target.checked})} className="rounded border-border w-4 h-4 accent-primary" />
               <Label htmlFor="sensitive-chk" className="cursor-pointer">Encrypted (Sensitive Data)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsFieldDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveField}>Save Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>Group related fields together into a category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
               <div className="col-span-1 space-y-2">
                 <Label>Icon</Label>
                 <Input value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})} placeholder="✨" className="text-center text-xl px-0" maxLength={2} />
               </div>
               <div className="col-span-3 space-y-2">
                 <Label>Category Title</Label>
                 <Input value={categoryForm.title} onChange={e => setCategoryForm({...categoryForm, title: e.target.value})} placeholder="e.g. Work Experience" />
               </div>
            </div>
            <div className="space-y-2">
              <Label>Category Type</Label>
              <Select value={categoryForm.isArray ? 'array' : 'object'} onValueChange={v => setCategoryForm({...categoryForm, isArray: v === 'array'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="object">Single Object (e.g. Personal Info)</SelectItem>
                  <SelectItem value="array">List/Set (e.g. Education History)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory}>Save Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? 
              This will also permanently remove any saved data associated with it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={itemToDelete?.type === 'category' ? confirmDeleteCategory : confirmDeleteField}>
              Yes, Delete {itemToDelete?.type === 'category' ? 'Category' : 'Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
