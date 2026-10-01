export function obtener(req, res) {
  res.json({ data: { region: req.region } });
}
