// Fiji / ImageJ 1.x Macro
// Export vertices from ROIs in ROI Manager to a CSV in /tmp (or Java temp dir).
// Columns: roi_index, point_index, x, y
// Skips ROIs that don't produce valid selection coordinates.



// Ensure there is an active image
imgID = getImageID();
if (imgID == 0) exit("No image open/active. Open an image and try again.");
selectImage(imgID);

// Ensure ROIs are associated with the active image (important on stacks / multiple images)
roiManager("Associate", "true");

n = roiManager("count");
if (n == 0) exit("ROI Manager is empty. Draw a line/path and press 'T' to add it.");

out = "roi_index,point_index,x,y\n";
print(out);
skipped = 0;
written = 0;

for (i = 0; i < n; i++) {
  selectImage(imgID);
  roiManager("Select", i);

  // If selection did not restore, skip
  if (selectionType() == -1) { skipped++; continue; }

  // Get vertices of the current selection
  getSelectionCoordinates(x, y);

  // Defensive: skip empty or NaN coordinate output
  if (x.length == 0) { skipped++; continue; }

  validPoints = 0;
  for (p = 0; p < x.length; p++) {
    // NaN check without relying on isNaN(): NaN != NaN
//    if (x[p] == x[p] && y[p] == y[p]) {
      out = out + i + "," + p + "," + x[p] + "," + y[p] + "\n";
      validPoints++;
      written++;
//    }
  }
  if (validPoints == 0) skipped++;
}
print(out);
//
//// Choose temp directory (prefer /tmp on macOS)
//tmpDir = "/tmp/";
//if (!File.isDirectory(tmpDir)) tmpDir = "";
//
//// Fallback: Java temp directory
//if (tmpDir == "") {
//  tmpDir = System.getProperty("java.io.tmpdir");
//  if (tmpDir == null) exit("Could not determine a temporary directory.");
//  if (!endsWith(tmpDir, "/") && !endsWith(tmpDir, "\\")) tmpDir = tmpDir + "/";
//}
////
//stamp = "" + getTime();
//savePath = tmpDir + "ij_paths_vertices_" + stamp + ".csv";
//File.saveString(out, savePath);
//
//print("Saved CSV to: " + savePath);
//print("Points written: " + written + " | ROIs skipped: " + skipped + " (out of " + n + ")");
print(out);