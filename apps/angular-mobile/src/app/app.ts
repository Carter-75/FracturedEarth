import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  title = 'angular-mobile';

  async ngOnInit() {
    console.log('Initializing Fractured Earth Mobile...');
    
    // RevenueCat SDK Initialization (Unified for MEAN Stack)
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    
    const apiKey = "test_MIadeZbJZTOYchrbHnqlaKoeggM";
    
    if (Capacitor.isNativePlatform()) {
      try {
        await Purchases.configure({ apiKey });
        console.log('RevenueCat configured successfully.');
        
        // Entitlement Check for Fractured Earth Pro
        const { customerInfo } = await Purchases.getCustomerInfo();
        if (customerInfo.entitlements.active["Fractured Earth Pro"]) {
          console.log('User has active Pro entitlement!');
          // Handle Pro Access logic
        }
      } catch (e) {
        console.error('Error initializing RevenueCat:', e);
      }
    } else {
      console.log('Running on Web - RevenueCat skips configuration unless using Web Billing.');
    }
  }
}
