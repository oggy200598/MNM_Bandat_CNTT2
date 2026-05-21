import express from "express";

import controller from "../controllers/api.controller.js";
import {
  authenticate,
  allowRoles
} from "../middleware/auth.js";

const router =
  express.Router();

router.get(
  "/health",
  controller.health
);

router.get(
  "/properties/map-data",
  controller.propertiesMap
);

router.get(
  "/properties/nearby/search",
  controller.propertiesNearby
);

router.get(
  "/properties/:id/images",
  controller.propertyImagesList
);

router.post(
  "/properties/:id/images",
  authenticate,
  allowRoles(
    "agent",
    "admin"
  ),
  controller.propertyImageCreate
);

router.post(
  "/properties/images/:imageId/primary",
  authenticate,
  allowRoles(
    "agent",
    "admin"
  ),
  controller.propertyImagePrimary
);

router.post(
  "/properties/images/:imageId/reorder",
  authenticate,
  allowRoles(
    "agent",
    "admin"
  ),
  controller.propertyImageReorder
);

router.delete(
  "/properties/images/:imageId",
  authenticate,
  allowRoles(
    "agent",
    "admin"
  ),
  controller.propertyImageDelete
);

router.get(
  "/properties",
  controller.propertiesList
);

router.get(
  "/properties/:id",
  controller.propertyDetail
);

router.post(
  "/properties",
  authenticate,
  allowRoles(
    "agent",
    "admin"
  ),
  controller.propertyCreate
);

router.put(
  "/properties/:id",
  authenticate,
  allowRoles(
    "agent",
    "admin"
  ),
  controller.propertyUpdate
);

router.patch(
  "/properties/:id/stage",
  authenticate,
  allowRoles(
    "agent",
    "admin"
  ),
  controller.propertyStageUpdate
);

router.delete(
  "/properties/:id",
  authenticate,
  allowRoles(
    "agent",
    "admin"
  ),
  controller.propertyDelete
);

router.get(
  "/amenities",
  controller.amenitiesList
);

router.post(
  "/amenities",
  authenticate,
  allowRoles("admin"),
  controller.amenityCreate
);

router.put(
  "/amenities/:id",
  authenticate,
  allowRoles("admin"),
  controller.amenityUpdate
);

router.delete(
  "/amenities/:id",
  authenticate,
  allowRoles("admin"),
  controller.amenityDelete
);

router.get(
  "/amenities/nearby",
  controller.amenitiesNearby
);

router.get(
  "/agents",
  controller.agentsList
);

router.post(
  "/agents",
  authenticate,
  allowRoles("admin"),
  controller.agentCreate
);

router.get(
  "/agents/:id",
  controller.agentDetail
);

router.put(
  "/agents/:id",
  authenticate,
  allowRoles("admin"),
  controller.agentUpdate
);

router.delete(
  "/agents/:id",
  authenticate,
  allowRoles("admin"),
  controller.agentDelete
);

router.get(
  "/agents/:id/reviews",
  controller.agentReviews
);

router.post(
  "/agents/:id/reviews",
  authenticate,
  controller.agentReviewCreate
);

router.get(
  "/dashboard",
  controller.dashboard
);

router.get(
  "/content/about",
  controller.aboutContent
);

router.put(
  "/content/about",
  authenticate,
  allowRoles("admin"),
  controller.aboutContentUpdate
);

router.post(
  "/leads",
  controller.leadCreate
);

router.get(
  "/leads",
  controller.leadsList
);

router.patch(
  "/leads/:id/stage",
  authenticate,
  allowRoles("admin"),
  controller.leadStageUpdate
);

router.delete(
  "/leads/:id",
  authenticate,
  allowRoles("admin"),
  controller.leadDelete
);

router.post(
  "/appointments",
  controller.appointmentCreate
);

router.get(
  "/wishlist",
  controller.wishlist
);

router.post(
  "/wishlist/:propertyId/toggle",
  controller.wishlistToggle
);

router.delete(
  "/wishlist/:propertyId",
  controller.wishlistRemove
);

router.get(
  "/compare",
  controller.compare
);

router.post(
  "/compare/:propertyId/toggle",
  controller.compareToggle
);

router.delete(
  "/compare/:propertyId",
  controller.compareRemove
);

router.get(
  "/saved-searches",
  controller.savedSearches
);

router.post(
  "/saved-searches",
  controller.savedSearchCreate
);

router.delete(
  "/saved-searches/:searchId",
  controller.savedSearchDelete
);

router.get(
  "/tasks",
  controller.tasksList
);

router.post(
  "/tasks",
  controller.tasksCreate
);

router.delete(
  "/tasks/:id",
  controller.tasksDelete
);

router.get(
  "/route",
  controller.route
);

export default router;
