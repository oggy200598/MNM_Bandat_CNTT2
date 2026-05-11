const service = require('../services/api.service');

function getToken(req) {
  const auth = req.headers.authorization || '';
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : req.headers['x-auth-token'] || req.query.token || null;
}

async function health(_req, res) { res.json({ ok: true }); }

async function propertiesList(req, res) {
  try { res.json({ data: await service.listProperties(req.query) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function propertiesMap(req, res) {
  try { res.json({ data: await service.listMapData(req.query) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function propertiesNearby(req, res) {
  try { res.json({ data: await service.listNearbyProperties(req.query) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function propertyDetail(req, res) {
  try {
    const data = await service.getPropertyById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Property not found' });
    res.json({ data });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function propertyCreate(req, res) {
  try { res.status(201).json({ data: await service.createProperty(req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function propertyUpdate(req, res) {
  try {
    const data = await service.updateProperty(req.params.id, req.body);
    if (!data) return res.status(404).json({ error: 'Property not found' });
    res.json({ data });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function propertyStageUpdate(req, res) {
  try {
    const data = await service.updatePropertyStage(req.params.id, req.body.listing_status || req.body.status);
    if (!data) return res.status(404).json({ error: 'Property not found' });
    res.json({ data });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function propertyDelete(req, res) {
  try {
    const ok = await service.deleteProperty(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Property not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function propertyImagesList(req, res) {
  try { res.json({ data: await service.listPropertyImages(req.params.id) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function propertyImageCreate(req, res) {
  try { res.status(201).json({ data: await service.createPropertyImage(req.params.id, req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function propertyImagePrimary(req, res) {
  try {
    const data = await service.setPrimaryImage(req.params.imageId);
    if (!data) return res.status(404).json({ error: 'Image not found' });
    res.json({ data });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function propertyImageDelete(req, res) {
  try {
    const ok = await service.deletePropertyImage(req.params.imageId);
    if (!ok) return res.status(404).json({ error: 'Image not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function propertyImageReorder(req, res) {
  try {
    const data = await service.reorderPropertyImage(req.params.imageId, req.body.sort_order);
    if (!data) return res.status(404).json({ error: 'Image not found' });
    res.json({ data });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function amenitiesList(req, res) {
  try { res.json({ data: await service.listAmenities(req.query) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function amenitiesNearby(req, res) {
  try { res.json({ data: await service.listNearbyAmenities(req.query) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function agentsList(_req, res) {
  try { res.json({ data: await service.listAgents() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function agentDetail(req, res) {
  try {
    const data = await service.getAgentById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Agent not found' });
    res.json({ data });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function leadCreate(req, res) {
  try { res.status(201).json({ data: await service.createLead(req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function leadStageUpdate(req, res) {
  try {
    const data = await service.updateLeadStage(req.params.id, req.body.pipeline_stage || req.body.stage);
    if (!data) return res.status(404).json({ error: 'Lead not found' });
    res.json({ data });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function appointmentCreate(req, res) {
  try { res.status(201).json({ data: await service.createAppointment(req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function dashboard(req, res) {
  try { res.json({ data: await service.getDashboardStats() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function wishlist(req, res) {
  try { res.json({ data: await service.listWishlist(getToken(req)) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function wishlistToggle(req, res) {
  try { res.json({ data: await service.toggleWishlist(getToken(req), req.params.propertyId) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function wishlistRemove(req, res) {
  try { res.json({ data: await service.removeWishlistItem(getToken(req), req.params.propertyId) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function compare(req, res) {
  try { res.json({ data: await service.listCompare(getToken(req)) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function compareToggle(req, res) {
  try { res.json({ data: await service.toggleCompare(getToken(req), req.params.propertyId) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function compareRemove(req, res) {
  try { res.json({ data: await service.removeCompareItem(getToken(req), req.params.propertyId) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function savedSearches(req, res) {
  try { res.json({ data: await service.listSavedSearches(getToken(req)) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function savedSearchCreate(req, res) {
  try { res.status(201).json({ data: await service.saveSearch(getToken(req), req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function savedSearchDelete(req, res) {
  try { res.json({ data: await service.deleteSavedSearch(getToken(req), req.params.searchId) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function login(req, res) {
  try {
    const session = await service.login(req.body);
    if (!session) return res.status(401).json({ error: 'Invalid username or password' });
    res.json({ data: session.user, token: session.token });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function me(req, res) {
  try {
    const data = await service.getCurrentUser(getToken(req));
    if (!data) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ data });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function profileUpdate(req, res) {
  try {
    const data = await service.updateProfile(getToken(req), req.body);
    if (!data) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ data });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function register(req, res) {
  try { res.status(201).json({ data: await service.register(req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function tasksList(_req, res) {
  try { res.json(await service.listTasks()); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function tasksCreate(req, res) {
  try { res.json(await service.createTask(req.body.title)); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function tasksDelete(req, res) {
  try { await service.deleteTask(req.params.id); res.json('Task deleted'); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = {
  health,
  propertiesList,
  propertiesMap,
  propertiesNearby,
  propertyDetail,
  propertyCreate,
  propertyUpdate,
  propertyStageUpdate,
  propertyDelete,
  propertyImagesList,
  propertyImageCreate,
  propertyImagePrimary,
  propertyImageDelete,
  propertyImageReorder,
  amenitiesList,
  amenitiesNearby,
  agentsList,
  agentDetail,
  leadCreate,
  leadStageUpdate,
  appointmentCreate,
  dashboard,
  wishlist,
  wishlistToggle,
  wishlistRemove,
  compare,
  compareToggle,
  compareRemove,
  savedSearches,
  savedSearchCreate,
  savedSearchDelete,
  login,
  me,
  profileUpdate,
  register,
  tasksList,
  tasksCreate,
  tasksDelete,
};
