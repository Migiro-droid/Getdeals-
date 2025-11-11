#!/usr/bin/env python3
"""
Fix the signup email issue by removing Brevo email sending from AuthContext
"""

file_path = 'src/contexts/AuthContext.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the section to replace - looking for the pattern
old_pattern_start = 'if (data.user) {\n        try {'
old_pattern_end = 'return; // Success - exit without throwing\n      }\n    } catch (error) {'

# Find indices
start_idx = content.find(old_pattern_start)
# Find the end - go from the start and find the catch after the try
if start_idx >= 0:
    # Find 'return; // Success - exit without throwing'
    return_idx = content.find('return; // Success - exit without throwing', start_idx)
    if return_idx >= 0:
        # Find the closing '}' after that return
        closing_idx = content.find('}\n    } catch (error) {', return_idx)
        if closing_idx >= 0:
            end_idx = closing_idx + len('}\n    } catch (error) {')
            
            # Extract the before and after
            before = content[:start_idx]
            after = content[end_idx:]
            
            # Create the replacement
            replacement = '''if (data.user) {
        // Supabase automatically sends confirmation email
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account before signing in.",
        });
        return;
      }
    } catch (error) {'''
            
            # Create new content
            new_content = before + replacement + after
            
            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✅ Fixed! Removed the Brevo email sending code from signup.")
        else:
            print("❌ Could not find the pattern end (closing brace)")
    else:
        print("❌ Could not find 'return; // Success - exit without throwing'")
else:
    print("❌ Could not find the pattern start")
