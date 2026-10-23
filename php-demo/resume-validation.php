<?php
/**
 * Student Resume Optimiser - Standalone PHP Validation & Session Demo
 * Demonstrates basic PHP form handling, validation, and session concepts
 * for college course presentation requirements.
 */

session_start();

$errors = [];
$successMessage = "";

// Form Submission Handler
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $fullName = trim($_POST['fullName'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $skills = trim($_POST['skills'] ?? '');

    // 1. Validation Logic
    if (empty($fullName)) {
        $errors[] = "Full Name is required.";
    }

    if (empty($email)) {
        $errors[] = "Email address is required.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email format.";
    }

    if (empty($skills)) {
        $errors[] = "Please enter at least one technical skill.";
    }

    // 2. Process Data if valid
    if (empty($errors)) {
        $_SESSION['validated_student'] = [
            'name' => htmlspecialchars($fullName),
            'email' => htmlspecialchars($email),
            'skills' => array_map('trim', explode(',', $skills)),
            'timestamp' => date('Y-m-d H:i:s')
        ];

        $successMessage = "Resume details validated and saved to PHP Session successfully!";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Resume Validation Demo</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #0f172a; padding: 2rem; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .title { font-size: 1.5rem; font-weight: 700; color: #2563eb; margin-bottom: 1rem; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; font-weight: 600; margin-bottom: 0.3rem; font-size: 0.9rem; }
        input[type="text"], input[type="email"] { width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; }
        button { background: #2563eb; color: white; padding: 0.65rem 1.25rem; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; width: 100%; }
        button:hover { background: #1d4ed8; }
        .alert-success { background: #dcfce7; color: #166534; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; }
        .alert-error { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; }
    </style>
</head>
<body>

<div class="card">
    <h2 class="title">🎓 PHP Resume Validation Demo</h2>
    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem;">
        Standalone PHP demonstration showing form validation and <code>$_SESSION</code> handling.
    </p>

    <?php if (!empty($successMessage)): ?>
        <div class="alert-success">✅ <?php echo $successMessage; ?></div>
    <?php endif; ?>

    <?php if (!empty($errors)): ?>
        <div class="alert-error">
            <?php foreach ($errors as $error): ?>
                <p>⚠️ <?php echo htmlspecialchars($error); ?></p>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <form method="POST" action="">
        <div class="form-group">
            <label>Student Full Name *</label>
            <input type="text" name="fullName" placeholder="e.g. Ankit Verma" value="<?php echo htmlspecialchars($_POST['fullName'] ?? ''); ?>">
        </div>

        <div class="form-group">
            <label>Email Address *</label>
            <input type="email" name="email" placeholder="student@college.edu" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>">
        </div>

        <div class="form-group">
            <label>Technical Skills (comma separated) *</label>
            <input type="text" name="skills" placeholder="PHP, MySQL, HTML, JavaScript" value="<?php echo htmlspecialchars($_POST['skills'] ?? ''); ?>">
        </div>

        <button type="submit">Validate & Store in PHP Session</button>
    </form>

    <?php if (isset($_SESSION['validated_student'])): ?>
        <div style="margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
            <h3>Session Data Preview:</h3>
            <pre style="background: #f1f5f9; padding: 1rem; border-radius: 4px; font-size: 0.85rem;"><?php print_r($_SESSION['validated_student']); ?></pre>
        </div>
    <?php endif; ?>
</div>

</body>
</html>
