void setup() {
  Serial.begin(9600);         // Start serial communication
}

void loop() {
  int turbidity = analogRead(A0);    // Read analog value from turbidity sensor
  float voltage = turbidity * (5.0 / 1023.0);  // Convert to voltage if needed

  Serial.print("Turbidity:");
  Serial.println(turbidity);         // Send turbidity value over Serial

  delay(2000);  // Delay between readings
}

